"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Play,
  CheckCircle,
  Search,
  BookOpen,
  Target,
  Clock,
  Eye,
  User,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

// Define courses and achievements directly in the component
const courses = [
  {
    id: "course_1",
    title: "Introduction to 3D Modeling",
    description: "Learn the basics of 3D modeling with this beginner-friendly course.",
    progress: 65,
    totalLessons: 12,
    completedLessons: 8,
    estimatedTime: "4 hours",
    difficulty: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1719439225311-eb726f79f082?q=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?height=200&width=300",
    instructor: "Er Aza M",
    category: "Fundamentals",
  },
  {
    id: "course_2",
    title: "Advanced 3D Modeling Techniques",
    description: "Master advanced techniques in 3D modeling for professional applications.",
    progress: 30,
    totalLessons: 18,
    completedLessons: 5,
    estimatedTime: "8 hours",
    difficulty: "Advanced",
    thumbnail: "https://plus.unsplash.com/premium_photo-1661675440353-6a6019c95bc7?q=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?height=200&width=300",
    instructor: "Er Aza M",
    category: "Advanced",
  },
  {
    id: "course_3",
    title: "3D Printing Fundamentals",
    description: "Design models specifically for 3D printing applications.",
    progress: 0,
    totalLessons: 10,
    completedLessons: 0,
    estimatedTime: "3 hours",
    difficulty: "Intermediate",
    thumbnail: "https://plus.unsplash.com/premium_photo-1661675440353-6a6019c95bc7?q=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?height=200&width=300",
    instructor: "Dr. Emily Rodriguez",
    category: "Printing",
  },
]

const achievements = [
  { id: 1, title: "First Model", description: "Uploaded your first 3D model", earned: true, icon: "🎯" },
  { id: 2, title: "Quick Learner", description: "Completed 5 lessons in one day", earned: true, icon: "⚡" },
  { id: 3, title: "3D Explorer", description: "Viewed 20 different models", earned: false, icon: "🔍" },
  { id: 4, title: "Master Builder", description: "Created 10 custom shapes", earned: false, icon: "🏗️" },
]

interface LearningProgress {
  userId: string
  completedLessons: string[]
  completedExercises: string[]
  scores: Record<string, number>
  totalTimeSpent: number
  lastActivity: Date
}

interface StudentDashboardProps {
  currentUser: any
  progress: LearningProgress | null
  onProgressUpdate: (updates: Partial<LearningProgress>) => void
  onLoadModel?: (modelUrl: string) => void
  onTabChange?: (tab: string) => void
  activeTab?: string
}

export function StudentDashboard({
  currentUser,
  progress,
  onProgressUpdate,
  onLoadModel,
  onTabChange,
  activeTab = "dashboard",
}: StudentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [teacherModels, setTeacherModels] = useState<any[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const safeProgress = progress || {
    userId: "",
    completedLessons: [],
    completedExercises: [],
    scores: {},
    totalTimeSpent: 0,
    lastActivity: new Date(),
  }

  const loadTeacherModels = async () => {
    setLoadingModels(true)
    try {
      const { data, error } = await supabase
        .from("teacher_models")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6)

      if (error) throw error
      setTeacherModels(data || [])
    } catch (error) {
      console.error("Error loading teacher models:", error)
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    loadTeacherModels()
  }, [])

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalProgress = courses.reduce((acc, course) => acc + course.progress, 0) / courses.length
  const completedCourses = courses.filter((course) => course.progress === 100).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              3D
            </div>
            <h1 className="text-xl font-semibold text-gray-900">3D Modeling Academy</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4 space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${activeTab === "dashboard" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => onTabChange?.("dashboard")}
            >
              <BookOpen className="w-4 h-4" />
              My Courses
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${activeTab === "learn" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => onTabChange?.("learn")}
            >
              <Target className="w-4 h-4" />
              3D Viewer
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${activeTab === "practice" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => onTabChange?.("practice")}
            >
              <Award className="w-4 h-4" />
              Practice
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${activeTab === "create" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => onTabChange?.("create")}
            >
              <User className="w-4 h-4" />
              Create
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${activeTab === "gallery" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => onTabChange?.("gallery")}
            >
              <User className="w-4 h-4" />
              Gallery
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(totalProgress)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Study Time</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(safeProgress.totalTimeSpent / 60)}h</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievements</p>
                    <p className="text-2xl font-bold text-gray-900">{achievements.filter((a) => a.earned).length}</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Courses Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h2>
            <div className="space-y-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Course {course.id.split("_")[1]}
                            </Badge>
                            <Badge
                              variant={
                                course.difficulty === "Beginner"
                                  ? "default"
                                  : course.difficulty === "Intermediate"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {course.difficulty}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                          <p className="text-gray-600 mb-4">{course.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              {course.instructor}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {course.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {course.completedLessons}/{course.totalLessons} lessons
                            </span>
                          </div>
                        </div>
                        <Button className="ml-4" onClick={() => onTabChange?.("learn")}>
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>

                    <div className="w-80 bg-gray-100 flex items-center justify-center">
                      <img
                        src={course.thumbnail || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 3D Model Previews Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3D Model Previews</h2>
            {loadingModels ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading models...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {teacherModels.map((model) => (
                  <Card
                    key={model.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => onLoadModel?.(model.file_url)}
                  >
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <img
                        src={model.thumbnail_url || "https://images.unsplash.com/photo-1635241161466-541f065683ba?q=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?height=200&width=200"}
                        alt={model.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=200"
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm truncate">{model.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {model.category?.replace("-", " ") || "General"}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          {model.view_count || 0}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Placeholder cards if not enough models */}
                {Array.from({ length: Math.max(0, 6 - teacherModels.length) }).map((_, index) => (
                  <Card key={`placeholder-${index}`} className="overflow-hidden opacity-50">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <CardContent className="p-3">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Achievements */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`p-4 ${achievement.earned ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                    </div>
                    {achievement.earned && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
