"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { STLViewer } from "@/components/stl-viewer"
import { FileUpload } from "@/components/file-upload"
import { ModelLibrary } from "@/components/model-library"
import { LearningDashboard } from "@/components/learning-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"
import { ExercisePanel } from "@/components/exercise-panel"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { AuthPanel } from "@/components/auth-panel"
import { ShapeBuilder } from "@/components/shape-builder"
import { AdvancedShapeBuilder } from "@/components/advanced-shape-builder"
import { ProjectGallery } from "@/components/project-gallery"
import { DebugPanel } from "@/components/debug-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LucideUser, GraduationCap } from "lucide-react"
import { logger, logUserAction, withErrorLogging, withAsyncErrorLogging } from "@/utils/logger"
import { TeacherModelGallery } from "@/components/teacher-model-gallery"

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher"
  classId?: string
}

interface LearningProgress {
  userId: string
  completedLessons: string[]
  completedExercises: string[]
  scores: Record<string, number>
  totalTimeSpent: number
  lastActivity: Date
}

interface SavedProject {
  id: string
  name: string
  shapes: any[]
  createdAt: Date
  thumbnail?: string
  likes: number
  views: number
  creator: string
}

export default function TeachingApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentModel, setCurrentModel] = useState<string | null>(null)
  const [uploadedModels, setUploadedModels] = useState<
    Array<{
      name: string
      url: string
      id: string
    }>
  >([])
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null)
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  // Safe localStorage operations with logging
  const safeGetItem = withErrorLogging(
    (key: string): string | null => {
      if (typeof window === "undefined") return null
      return localStorage.getItem(key)
    },
    "storage",
    "localStorage_get",
  )

  const safeSetItem = withErrorLogging(
    (key: string, value: string): void => {
      if (typeof window === "undefined") return
      localStorage.setItem(key, value)
    },
    "storage",
    "localStorage_set",
  )

  const safeRemoveItem = withErrorLogging(
    (key: string): void => {
      if (typeof window === "undefined") return
      localStorage.removeItem(key)
    },
    "storage",
    "localStorage_remove",
  )

  const safeParse = withErrorLogging(
    (jsonString: string | null): any => {
      if (!jsonString) return null
      return JSON.parse(jsonString)
    },
    "data",
    "json_parse",
  )

  const safeStringify = withErrorLogging(
    (obj: any): string => {
      return JSON.stringify(obj)
    },
    "data",
    "json_stringify",
  )

  // Initialize app with comprehensive logging
  useEffect(() => {
    const initializeApp = withAsyncErrorLogging(
      async () => {
        const startTime = logger.startTimer("app_initialization")

        try {
          setIsLoading(true)
          logger.info("app_lifecycle", "Application starting", {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          })

          const savedUser = safeGetItem("currentUser")
          const parsedUser = safeParse(savedUser)

          if (parsedUser && parsedUser.id && typeof parsedUser.id === "string") {
            logger.info("auth", "Restoring user session", { userId: parsedUser.id, role: parsedUser.role })
            setCurrentUser(parsedUser)
            logger.setUserId(parsedUser.id)

            await loadUserProgress(parsedUser.id)
            await loadUserProjects(parsedUser.id)

            logUserAction("session_restored", "auth", { userId: parsedUser.id, role: parsedUser.role })
          } else {
            logger.info("auth", "No existing session found")
          }

          logger.endTimer("app_initialization", startTime, "performance")
        } catch (error) {
          logger.error("app_lifecycle", "Failed to initialize application", error)
          safeRemoveItem("currentUser")
        } finally {
          setIsLoading(false)
          logger.info("app_lifecycle", "Application initialization completed")
        }
      },
      "app_lifecycle",
      "initialize_app",
    )

    initializeApp()

    // Track tab changes
    const handleVisibilityChange = () => {
      logUserAction("page_visibility_change", "navigation", {
        hidden: document.hidden,
        timestamp: new Date().toISOString(),
      })
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      logger.info("app_lifecycle", "Application cleanup completed")
    }
  }, [])

  const loadUserProgress = withAsyncErrorLogging(
    async (userId: string) => {
      if (!userId || typeof userId !== "string") {
        logger.warn("data_loading", "Invalid userId provided for progress loading", { userId })
        return
      }

      const startTime = logger.startTimer("load_user_progress")

      try {
        logger.debug("data_loading", "Loading user progress", { userId })

        const savedProgress = safeGetItem(`progress_${userId}`)
        const parsed = safeParse(savedProgress)

        if (parsed && typeof parsed === "object") {
          const safeProgress: LearningProgress = {
            userId: parsed.userId || userId,
            completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
            completedExercises: Array.isArray(parsed.completedExercises) ? parsed.completedExercises : [],
            scores: parsed.scores && typeof parsed.scores === "object" ? parsed.scores : {},
            totalTimeSpent: typeof parsed.totalTimeSpent === "number" ? parsed.totalTimeSpent : 0,
            lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : new Date(),
          }

          setLearningProgress(safeProgress)
          logger.info("data_loading", "User progress loaded successfully", {
            userId,
            completedLessons: safeProgress.completedLessons.length,
            completedExercises: safeProgress.completedExercises.length,
            totalTimeSpent: safeProgress.totalTimeSpent,
          })
        } else {
          const newProgress: LearningProgress = {
            userId,
            completedLessons: [],
            completedExercises: [],
            scores: {},
            totalTimeSpent: 0,
            lastActivity: new Date(),
          }
          setLearningProgress(newProgress)
          logger.info("data_loading", "Created new user progress", { userId })
        }

        logger.endTimer("load_user_progress", startTime, "data_loading")
      } catch (error) {
        logger.error("data_loading", "Failed to load user progress", { error, userId })
        const fallbackProgress: LearningProgress = {
          userId,
          completedLessons: [],
          completedExercises: [],
          scores: {},
          totalTimeSpent: 0,
          lastActivity: new Date(),
        }
        setLearningProgress(fallbackProgress)
      }
    },
    "data_loading",
    "load_user_progress",
  )

  const loadUserProjects = withAsyncErrorLogging(
    async (userId: string) => {
      if (!userId || typeof userId !== "string") {
        logger.warn("data_loading", "Invalid userId provided for projects loading", { userId })
        return
      }

      const startTime = logger.startTimer("load_user_projects")

      try {
        logger.debug("data_loading", "Loading user projects", { userId })

        const savedProjects = safeGetItem(`projects_${userId}`)
        const parsed = safeParse(savedProjects)

        if (Array.isArray(parsed)) {
          const safeProjects = parsed
            .filter((project) => project && typeof project === "object" && project.id)
            .map((project) => ({
              id: project.id || `project_${Date.now()}`,
              name: project.name || "Untitled Project",
              shapes: Array.isArray(project.shapes) ? project.shapes : [],
              createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
              likes: typeof project.likes === "number" ? project.likes : 0,
              views: typeof project.views === "number" ? project.views : 0,
              creator: project.creator || "Unknown",
              thumbnail: project.thumbnail || undefined,
            }))

          setSavedProjects(safeProjects)
          logger.info("data_loading", "User projects loaded successfully", {
            userId,
            projectCount: safeProjects.length,
          })
        } else {
          setSavedProjects([])
          logger.info("data_loading", "No existing projects found", { userId })
        }

        logger.endTimer("load_user_projects", startTime, "data_loading")
      } catch (error) {
        logger.error("data_loading", "Failed to load user projects", { error, userId })
        setSavedProjects([])
      }
    },
    "data_loading",
    "load_user_projects",
  )

  const updateProgress = withErrorLogging(
    (updates: Partial<LearningProgress>) => {
      if (!learningProgress || !currentUser || !updates) {
        logger.warn("progress_update", "Invalid parameters for progress update", {
          hasProgress: !!learningProgress,
          hasUser: !!currentUser,
          hasUpdates: !!updates,
        })
        return
      }

      const startTime = logger.startTimer("update_progress")

      try {
        const updatedProgress = {
          ...learningProgress,
          ...updates,
          lastActivity: new Date(),
          userId: learningProgress.userId || currentUser.id,
          completedLessons: Array.isArray(updates.completedLessons)
            ? updates.completedLessons
            : learningProgress.completedLessons || [],
          completedExercises: Array.isArray(updates.completedExercises)
            ? updates.completedExercises
            : learningProgress.completedExercises || [],
          scores:
            updates.scores && typeof updates.scores === "object"
              ? { ...learningProgress.scores, ...updates.scores }
              : learningProgress.scores || {},
          totalTimeSpent:
            typeof updates.totalTimeSpent === "number" ? updates.totalTimeSpent : learningProgress.totalTimeSpent || 0,
        }

        setLearningProgress(updatedProgress)
        safeSetItem(`progress_${currentUser.id}`, safeStringify(updatedProgress))

        logger.info("progress_update", "Progress updated successfully", {
          userId: currentUser.id,
          updates: Object.keys(updates),
          newCompletedLessons: updatedProgress.completedLessons.length,
          newCompletedExercises: updatedProgress.completedExercises.length,
        })

        logUserAction("progress_updated", "learning", updates)
        logger.endTimer("update_progress", startTime, "progress_update")
      } catch (error) {
        logger.error("progress_update", "Failed to update progress", { error, updates })
      }
    },
    "progress_update",
    "update_progress",
  )

  const handleLogin = withErrorLogging(
    (user: User) => {
      if (!user || !user.id || typeof user.id !== "string") {
        logger.error("auth", "Invalid user data provided for login", { user })
        return
      }

      const startTime = logger.startTimer("user_login")

      try {
        const safeUser: User = {
          id: user.id,
          name: user.name || "Unknown User",
          email: user.email || "",
          role: user.role || "student",
          classId: user.classId || undefined,
        }

        setCurrentUser(safeUser)
        logger.setUserId(safeUser.id)
        safeSetItem("currentUser", safeStringify(safeUser))

        loadUserProgress(safeUser.id)
        loadUserProjects(safeUser.id)

        logger.info("auth", "User login successful", {
          userId: safeUser.id,
          role: safeUser.role,
          hasClassId: !!safeUser.classId,
        })

        logUserAction("user_login", "auth", {
          userId: safeUser.id,
          role: safeUser.role,
          loginMethod: "form",
        })

        logger.endTimer("user_login", startTime, "auth")
      } catch (error) {
        logger.error("auth", "Login failed", { error, userId: user?.id })
      }
    },
    "auth",
    "handle_login",
  )

  const handleLogout = withErrorLogging(
    () => {
      const startTime = logger.startTimer("user_logout")
      const userId = currentUser?.id

      try {
        logger.info("auth", "User logout initiated", { userId })

        setCurrentUser(null)
        setLearningProgress(null)
        setSavedProjects([])
        safeRemoveItem("currentUser")

        logUserAction("user_logout", "auth", { userId })
        logger.clearUserId()

        logger.info("auth", "User logout completed", { userId })
        logger.endTimer("user_logout", startTime, "auth")
      } catch (error) {
        logger.error("auth", "Logout failed", { error, userId })
        // Force clear state even if localStorage fails
        setCurrentUser(null)
        setLearningProgress(null)
        setSavedProjects([])
      }
    },
    "auth",
    "handle_logout",
  )

  const handleFileUpload = withErrorLogging(
    (file: File) => {
      if (!file || typeof file !== "object") {
        logger.warn("file_upload", "Invalid file provided", { file })
        return
      }

      const startTime = logger.startTimer("file_upload")

      try {
        const url = URL.createObjectURL(file)
        const newModel = {
          name: file.name || "Unnamed Model",
          url,
          id: `model_${Date.now()}`,
        }

        setUploadedModels((prev) => [...(Array.isArray(prev) ? prev : []), newModel])
        setCurrentModel(url)

        logger.info("file_upload", "File uploaded successfully", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          modelId: newModel.id,
        })

        logUserAction("file_uploaded", "content", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })

        logger.endTimer("file_upload", startTime, "file_upload")
      } catch (error) {
        logger.error("file_upload", "File upload failed", { error, fileName: file?.name })
        alert("Error uploading file. Please try again.")
      }
    },
    "file_upload",
    "handle_file_upload",
  )

  const handleModelSelect = withErrorLogging(
    (modelUrl: string) => {
      if (typeof modelUrl === "string") {
        setCurrentModel(modelUrl)
        logUserAction("model_selected", "content", { modelUrl })
        logger.info("model_selection", "Model selected", { modelUrl })
      }
    },
    "model_selection",
    "handle_model_select",
  )

  const handleSaveProject = withErrorLogging(
    (shapes: any[], name: string) => {
      if (!currentUser || !Array.isArray(shapes)) {
        logger.warn("project_save", "Invalid parameters for project save", {
          hasUser: !!currentUser,
          shapesIsArray: Array.isArray(shapes),
        })
        return
      }

      const startTime = logger.startTimer("save_project")

      try {
        const newProject: SavedProject = {
          id: `project_${Date.now()}`,
          name: name || "Untitled Project",
          shapes: shapes || [],
          createdAt: new Date(),
          likes: 0,
          views: 0,
          creator: currentUser.name || "Unknown",
        }

        const updatedProjects = [...(Array.isArray(savedProjects) ? savedProjects : []), newProject]
        setSavedProjects(updatedProjects)
        safeSetItem(`projects_${currentUser.id}`, safeStringify(updatedProjects))

        logger.info("project_save", "Project saved successfully", {
          projectId: newProject.id,
          projectName: newProject.name,
          shapeCount: shapes.length,
          userId: currentUser.id,
        })

        logUserAction("project_saved", "creation", {
          projectId: newProject.id,
          projectName: newProject.name,
          shapeCount: shapes.length,
        })

        logger.endTimer("save_project", startTime, "project_save")
      } catch (error) {
        logger.error("project_save", "Failed to save project", { error, projectName: name })
        alert("Error saving project. Please try again.")
      }
    },
    "project_save",
    "handle_save_project",
  )

  const handleLoadProject = withErrorLogging(
    (project: SavedProject) => {
      if (!project || !currentUser) {
        logger.warn("project_load", "Invalid parameters for project load", {
          hasProject: !!project,
          hasUser: !!currentUser,
        })
        return
      }

      const startTime = logger.startTimer("load_project")

      try {
        setActiveTab("create")
        const updatedProjects = (Array.isArray(savedProjects) ? savedProjects : [])
          .map((p) => (p && p.id === project.id ? { ...p, views: (p.views || 0) + 1 } : p))
          .filter(Boolean)

        setSavedProjects(updatedProjects)
        safeSetItem(`projects_${currentUser.id}`, safeStringify(updatedProjects))

        logger.info("project_load", "Project loaded successfully", {
          projectId: project.id,
          projectName: project.name,
          userId: currentUser.id,
        })

        logUserAction("project_loaded", "creation", {
          projectId: project.id,
          projectName: project.name,
        })

        logger.endTimer("load_project", startTime, "project_load")
      } catch (error) {
        logger.error("project_load", "Failed to load project", { error, projectId: project?.id })
      }
    },
    "project_load",
    "handle_load_project",
  )

  const handleDeleteProject = withErrorLogging(
    (projectId: string) => {
      if (!currentUser || !projectId || typeof projectId !== "string") {
        logger.warn("project_delete", "Invalid parameters for project delete", {
          hasUser: !!currentUser,
          projectId,
        })
        return
      }

      const startTime = logger.startTimer("delete_project")

      try {
        const projectToDelete = savedProjects.find((p) => p?.id === projectId)
        const updatedProjects = (Array.isArray(savedProjects) ? savedProjects : []).filter(
          (p) => p && p.id !== projectId,
        )

        setSavedProjects(updatedProjects)
        safeSetItem(`projects_${currentUser.id}`, safeStringify(updatedProjects))

        logger.info("project_delete", "Project deleted successfully", {
          projectId,
          projectName: projectToDelete?.name,
          userId: currentUser.id,
        })

        logUserAction("project_deleted", "creation", {
          projectId,
          projectName: projectToDelete?.name,
        })

        logger.endTimer("delete_project", startTime, "project_delete")
      } catch (error) {
        logger.error("project_delete", "Failed to delete project", { error, projectId })
      }
    },
    "project_delete",
    "handle_delete_project",
  )

  const handleTabChange = withErrorLogging(
    (newTab: string) => {
      const previousTab = activeTab
      setActiveTab(newTab)

      logUserAction("tab_changed", "navigation", {
        from: previousTab,
        to: newTab,
        timestamp: new Date().toISOString(),
      })

      logger.info("navigation", "Tab changed", { from: previousTab, to: newTab })
    },
    "navigation",
    "handle_tab_change",
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading 3D Learning Platform...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthPanel onLogin={handleLogin} />
  }

  // For students, show the new dashboard by default
  if (currentUser.role === "student" && activeTab === "dashboard") {
    return (
      <div className="min-h-screen">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                3D
              </div>
              <h1 className="text-xl font-semibold text-gray-900">3D Modeling Academy</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <LucideUser className="w-5 h-5" />
                <span className="font-medium">{currentUser.name || "User"}</span>
                <span className="text-sm text-gray-500">({currentUser.role || "student"})</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">🏠 Dashboard</TabsTrigger>
              <TabsTrigger value="learn">📚 Learn</TabsTrigger>
              <TabsTrigger value="create">🎨 Create</TabsTrigger>
              <TabsTrigger value="advanced">⚡ Advanced</TabsTrigger>
              <TabsTrigger value="gallery">🖼️ Gallery</TabsTrigger>
              <TabsTrigger value="practice">🎮 Practice</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <StudentDashboard
                currentUser={currentUser}
                progress={learningProgress}
                onProgressUpdate={updateProgress}
                onLoadModel={(modelUrl) => {
                  setCurrentModel(modelUrl)
                  setActiveTab("learn") // Switch to learn tab when model is selected
                }}
                onTabChange={setActiveTab}
                activeTab={activeTab}
              />
            </TabsContent>

            <TabsContent value="learn" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Panel - Controls and Library */}
                <div className="lg:col-span-1 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upload STL Files</CardTitle>
                      <CardDescription>Upload your 3D models to view and analyze</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload onFileUpload={handleFileUpload} />
                    </CardContent>
                  </Card>

                  <ModelLibrary
                    models={Array.isArray(uploadedModels) ? uploadedModels : []}
                    onModelSelect={handleModelSelect}
                    currentModel={currentModel}
                  />

                  <TeacherModelGallery
                    onModelSelect={(modelUrl, modelData) => {
                      setCurrentModel(modelUrl)
                      logUserAction("teacher_model_selected", "learning", {
                        modelId: modelData.id,
                        modelName: modelData.name,
                      })
                    }}
                    currentModel={currentModel}
                  />
                </div>

                {/* Center Panel - 3D Viewer */}
                <div className="lg:col-span-2">
                  <Card className="h-[600px]">
                    <CardHeader>
                      <CardTitle className="text-lg">3D Model Viewer</CardTitle>
                      <CardDescription>Interact with your 3D models - rotate, zoom, and explore</CardDescription>
                    </CardHeader>
                    <CardContent className="h-full p-0">
                      <STLViewer modelUrl={currentModel} />
                    </CardContent>
                  </Card>
                </div>

                {/* Right Panel - Learning Materials */}
                <div className="lg:col-span-1">
                  <LearningDashboard
                    currentModel={currentModel}
                    progress={learningProgress}
                    onProgressUpdate={updateProgress}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <ShapeBuilder onSaveProject={handleSaveProject} />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <AdvancedShapeBuilder />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <ProjectGallery
                projects={Array.isArray(savedProjects) ? savedProjects : []}
                onLoadProject={handleLoadProject}
                onDeleteProject={handleDeleteProject}
              />
            </TabsContent>

            <TabsContent value="practice" className="space-y-6">
              <ExercisePanel
                currentModel={currentModel}
                progress={learningProgress}
                onProgressUpdate={updateProgress}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DebugPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">3D Design Learning Platform</h1>
            <p className="text-lg text-gray-600">Learn, create, and master 3D design!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              {currentUser.role === "teacher" ? (
                <GraduationCap className="w-5 h-5" />
              ) : (
                <LucideUser className="w-5 h-5" />
              )}
              <span className="font-medium">{currentUser.name || "User"}</span>
              <span className="text-sm text-gray-500">({currentUser.role || "student"})</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            {currentUser.role === "student" && <TabsTrigger value="dashboard">🏠 Dashboard</TabsTrigger>}
            <TabsTrigger value="learn">📚 Learn</TabsTrigger>
            <TabsTrigger value="create">🎨 Create</TabsTrigger>
            <TabsTrigger value="advanced">⚡ Advanced</TabsTrigger>
            <TabsTrigger value="gallery">🖼️ Gallery</TabsTrigger>
            <TabsTrigger value="practice">🎮 Practice</TabsTrigger>
            {currentUser.role === "teacher" && <TabsTrigger value="teach">👨‍🏫 Teach</TabsTrigger>}
          </TabsList>

          <TabsContent value="learn" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Panel - Controls and Library */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload STL Files</CardTitle>
                    <CardDescription>Upload your 3D models to view and analyze</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload onFileUpload={handleFileUpload} />
                  </CardContent>
                </Card>

                <ModelLibrary
                  models={Array.isArray(uploadedModels) ? uploadedModels : []}
                  onModelSelect={handleModelSelect}
                  currentModel={currentModel}
                />

                <TeacherModelGallery
                  onModelSelect={(modelUrl, modelData) => {
                    setCurrentModel(modelUrl)
                    logUserAction("teacher_model_selected", "learning", {
                      modelId: modelData.id,
                      modelName: modelData.name,
                    })
                  }}
                  currentModel={currentModel}
                />
              </div>

              {/* Center Panel - 3D Viewer */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="text-lg">3D Model Viewer</CardTitle>
                    <CardDescription>Interact with your 3D models - rotate, zoom, and explore</CardDescription>
                  </CardHeader>
                  <CardContent className="h-full p-0">
                    <STLViewer modelUrl={currentModel} />
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Learning Materials */}
              <div className="lg:col-span-1">
                <LearningDashboard
                  currentModel={currentModel}
                  progress={learningProgress}
                  onProgressUpdate={updateProgress}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <ShapeBuilder onSaveProject={handleSaveProject} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <AdvancedShapeBuilder />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <ProjectGallery
              projects={Array.isArray(savedProjects) ? savedProjects : []}
              onLoadProject={handleLoadProject}
              onDeleteProject={handleDeleteProject}
            />
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <ExercisePanel currentModel={currentModel} progress={learningProgress} onProgressUpdate={updateProgress} />
          </TabsContent>

          {currentUser.role === "teacher" && (
            <TabsContent value="teach" className="space-y-6">
              <TeacherDashboard currentUser={currentUser} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <DebugPanel />
    </div>
  )
}
