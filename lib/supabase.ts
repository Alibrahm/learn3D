import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  clerk_user_id: string
  email: string
  name: string
  role: "student" | "teacher"
  class_id?: string
  created_at: string
  updated_at: string
}

export interface LearningProgress {
  id: string
  user_id: string
  completed_lessons: string[]
  completed_exercises: string[]
  scores: Record<string, number>
  total_time_spent: number
  last_activity: string
  created_at: string
  updated_at: string
}

export interface SavedProject {
  id: string
  user_id: string
  name: string
  shapes: any[]
  thumbnail?: string
  likes: number
  views: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface UserAction {
  id: string
  user_id: string
  action: string
  category: string
  data?: any
  success: boolean
  duration?: number
  created_at: string
}

// Supabase client for server-side operations
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
