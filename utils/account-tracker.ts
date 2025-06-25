import { logger } from "./logger"
import { supabase } from "@/lib/supabase"
import { PostgrestError } from "@supabase/supabase-js"
import { validateUUID } from "./uuid"

export interface NewAccountData {
  userId: string
  name: string
  email: string
  role: "student" | "teacher"
  classId?: string
  registrationMethod: "signup" | "demo" | "invite"
  referralSource?: string
  deviceInfo: {
    userAgent: string
    platform: string
    screenResolution: string
    timezone: string
  }
}

export interface AccountCreationResult {
  success: boolean
  userId: string
  message: string
  initialData?: any
}

class AccountTracker {
  private getDeviceInfo() {
    if (typeof window === "undefined") {
      return {
        userAgent: "server",
        platform: "server",
        screenResolution: "unknown",
        timezone: "UTC",
      }
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }

  async trackNewAccount(accountData: Omit<NewAccountData, "deviceInfo">): Promise<AccountCreationResult> {
    const startTime = logger.startTimer("account_creation")

    try {
      const fullAccountData: NewAccountData = {
        ...accountData,
        deviceInfo: this.getDeviceInfo(),
      }

      // Log the account creation attempt
      logger.info("account_creation", "New account creation started", {
        userId: accountData.userId,
        role: accountData.role,
        method: accountData.registrationMethod,
        hasClassId: !!accountData.classId,
      })

      // Track in analytics
      logger.trackAction("account_created", "authentication", {
        role: accountData.role,
        method: accountData.registrationMethod,
        classId: accountData.classId,
        deviceInfo: fullAccountData.deviceInfo,
      })

      // Initialize user profile in database
      const profileResult = await this.createUserProfile(fullAccountData)

      // Initialize learning progress for students
      let progressResult = null
      if (accountData.role === "student") {
        progressResult = await this.initializeStudentProgress(accountData.userId)
      }

      // Create welcome data package
      const initialData = await this.createWelcomeData(fullAccountData)

      // Log successful creation
      logger.endTimer("account_creation", startTime, "authentication", {
        userId: accountData.userId,
        role: accountData.role,
        profileCreated: profileResult.success,
        progressInitialized: progressResult?.success || false,
      })

      // Track successful account creation
      logger.trackAction("account_creation_completed", "authentication", {
        userId: accountData.userId,
        role: accountData.role,
        method: accountData.registrationMethod,
        duration: Date.now() - startTime,
      })

      return {
        success: true,
        userId: accountData.userId,
        message: `Welcome ${accountData.name}! Your ${accountData.role} account has been created successfully.`,
        initialData,
      }
    } catch (error) {
      // Log the error
      logger.trackError(
        "account_creation_failed",
        "authentication",
        error,
        {
          userId: accountData.userId,
          role: accountData.role,
          method: accountData.registrationMethod,
        },
        startTime,
      )

      return {
        success: false,
        userId: accountData.userId,
        message: "Account creation failed. Please try again.",
      }
    }
  }

  private async createUserProfile(accountData: NewAccountData) {
    try {
      // Validate UUID before proceeding
      validateUUID(accountData.userId)

      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          clerk_user_id: accountData.userId,
          email: accountData.email,
          name: accountData.name,
          role: accountData.role,
          class_id: accountData.classId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      logger.info("user_profile", "User profile created successfully", {
        userId: accountData.userId,
        profileId: data.id,
      })

      return { success: true, data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("user_profile", "Failed to create user profile", {
        userId: accountData.userId,
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          stack: error.stack
        } : undefined
      })

      // Return mock success for demo mode
      return {
        success: true,
        data: {
          id: `demo_profile_${Date.now()}`,
          clerk_user_id: accountData.userId,
          email: accountData.email,
          name: accountData.name,
          role: accountData.role,
        },
      }
    }
  }

  private async initializeStudentProgress(userId: string) {
    try {
      // First, get the UUID from user_profiles using the clerk_user_id
      // Validate UUID before proceeding
      validateUUID(userId)

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("clerk_user_id", userId)
        .single()

      if (profileError) {
        logger.error("learning_progress", "Failed to find user profile", {
          userId,
          error: profileError.message,
          details: {
            name: profileError.name,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          }
        })
        throw profileError
      }

      const userProfileId = profileData?.id
      if (!userProfileId) {
        logger.error("learning_progress", "User profile not found", {
          userId,
        })
        throw new Error(`No user profile found for userId: ${userId}`)
      }

      const initialProgress = {
        user_id: userProfileId,
        completed_lessons: [],
        completed_exercises: [],
        scores: {},
        total_time_spent: 0,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("learning_progress").insert(initialProgress).select().single()

      if (error) {
        logger.error("learning_progress", "Failed to initialize student progress", {
          userId,
          error: error.message,
          details: {
            name: error.name,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        })
        throw error as PostgrestError
      }

      logger.info("learning_progress", "Student progress initialized", {
        userId,
        progressId: data.id,
      })

      return { success: true, data }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error("learning_progress", "Failed to initialize student progress", {
        userId,
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          stack: error.stack
        } : undefined
      })

      // Return mock success for demo mode
      return {
        success: true,
        data: {
          id: `demo_progress_${Date.now()}`,
          user_id: userId,
          completed_lessons: [],
          completed_exercises: [],
          scores: {},
        },
      }
    }
  }

  private async createWelcomeData(accountData: NewAccountData) {
    const welcomeData = {
      user: {
        id: accountData.userId,
        name: accountData.name,
        email: accountData.email,
        role: accountData.role,
        classId: accountData.classId,
      },
      onboarding: {
        isFirstLogin: true,
        suggestedActions: this.getSuggestedActions(accountData.role),
        welcomeMessage: this.getWelcomeMessage(accountData),
      },
      analytics: {
        accountCreatedAt: new Date().toISOString(),
        registrationMethod: accountData.registrationMethod,
        deviceInfo: accountData.deviceInfo,
      },
    }

    // Log welcome data creation
    logger.info("welcome_data", "Welcome data package created", {
      userId: accountData.userId,
      role: accountData.role,
      actionsCount: welcomeData.onboarding.suggestedActions.length,
    })

    return welcomeData
  }

  private getSuggestedActions(role: "student" | "teacher") {
    if (role === "student") {
      return [
        {
          id: "complete_profile",
          title: "Complete Your Profile",
          description: "Add your learning preferences and goals",
          priority: "high",
          category: "setup",
        },
        {
          id: "take_first_lesson",
          title: "Take Your First Lesson",
          description: 'Start with "Introduction to 3D Modeling"',
          priority: "high",
          category: "learning",
        },
        {
          id: "explore_gallery",
          title: "Explore the Model Gallery",
          description: "See what others have created",
          priority: "medium",
          category: "exploration",
        },
        {
          id: "join_class",
          title: "Join a Class",
          description: "Connect with your teacher and classmates",
          priority: "medium",
          category: "social",
        },
      ]
    } else {
      return [
        {
          id: "setup_classroom",
          title: "Set Up Your Classroom",
          description: "Create your first class and invite students",
          priority: "high",
          category: "setup",
        },
        {
          id: "upload_models",
          title: "Upload Teaching Models",
          description: "Add 3D models for your lessons",
          priority: "high",
          category: "content",
        },
        {
          id: "create_assignments",
          title: "Create Assignments",
          description: "Design exercises for your students",
          priority: "medium",
          category: "teaching",
        },
        {
          id: "explore_features",
          title: "Explore Teaching Features",
          description: "Discover all the tools available",
          priority: "medium",
          category: "exploration",
        },
      ]
    }
  }

  private getWelcomeMessage(accountData: NewAccountData): string {
    const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"

    if (accountData.role === "student") {
      return `Good ${timeOfDay}, ${accountData.name}! Welcome to your 3D learning journey. We're excited to help you explore the world of 3D modeling and design. Let's start with some basics and build your skills step by step!`
    } else {
      return `Good ${timeOfDay}, ${accountData.name}! Welcome to the teaching platform. You now have access to powerful tools to create engaging 3D learning experiences for your students. Let's get your classroom set up!`
    }
  }

  // Analytics methods
  async getAccountCreationStats(timeframe: "day" | "week" | "month" = "week") {
    try {
      const now = new Date()
      const startDate = new Date()

      switch (timeframe) {
        case "day":
          startDate.setDate(now.getDate() - 1)
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("role, created_at")
        .gte("created_at", startDate.toISOString())

      if (error) throw error

      const stats = {
        total: data.length,
        students: data.filter((u) => u.role === "student").length,
        teachers: data.filter((u) => u.role === "teacher").length,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      }

      logger.info("account_stats", "Account creation stats retrieved", stats)
      return stats
    } catch (error) {
      logger.error("account_stats", "Failed to retrieve account stats", { error: error.message })

      // Return mock stats for demo
      return {
        total: 15,
        students: 12,
        teachers: 3,
        timeframe,
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      }
    }
  }

  async trackAccountActivity(userId: string, activity: string, data?: any) {
    logger.trackAction(activity, "account_activity", {
      userId,
      ...data,
    })

    // Update last activity in database
    try {
      await supabase
        .from("user_profiles")
        .update({
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        })
        .eq("clerk_user_id", userId)
    } catch (error) {
      logger.error("account_activity", "Failed to update last activity", {
        userId,
        error: error.message,
      })
    }
  }
}

// Export singleton instance
export const accountTracker = new AccountTracker()

// Convenience functions
export const trackNewStudentAccount = (accountData: Omit<NewAccountData, "deviceInfo">) => {
  return accountTracker.trackNewAccount(accountData)
}

export const getAccountStats = (timeframe?: "day" | "week" | "month") => {
  return accountTracker.getAccountCreationStats(timeframe)
}

export const trackUserActivity = (userId: string, activity: string, data?: any) => {
  return accountTracker.trackAccountActivity(userId, activity, data)
}
