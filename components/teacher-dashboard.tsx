"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, Target, TrendingUp, User } from "lucide-react"
import { Download, Eye, Trash2, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

interface UserType {
  id: string
  name: string
  email: string
  role: "student" | "teacher"
  classId?: string
}

interface StudentProgress {
  userId: string
  userName: string
  completedLessons: string[]
  completedExercises: string[]
  scores: Record<string, number>
  totalTimeSpent: number
  lastActivity: Date
}

interface TeacherDashboardProps {
  currentUser: UserType
}

export function TeacherDashboard({ currentUser }: TeacherDashboardProps) {
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [teacherModels, setTeacherModels] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "info" | null
    message: string
  }>({ type: null, message: "" })

  useEffect(() => {
    try {
      // Mock student data - in real app, this would fetch from your database
      const mockStudents: StudentProgress[] = [
        {
          userId: "student_1",
          userName: "Alice Johnson",
          completedLessons: ["lesson_1", "lesson_2"],
          completedExercises: ["exercise_1"],
          scores: { exercise_1: 85 },
          totalTimeSpent: 120,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          userId: "student_2",
          userName: "Bob Smith",
          completedLessons: ["lesson_1"],
          completedExercises: [],
          scores: {},
          totalTimeSpent: 45,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          userId: "student_3",
          userName: "Carol Davis",
          completedLessons: ["lesson_1", "lesson_2", "lesson_3"],
          completedExercises: ["exercise_1", "exercise_2"],
          scores: { exercise_1: 95, exercise_2: 78 },
          totalTimeSpent: 180,
          lastActivity: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
        },
      ]
      setStudents(mockStudents)
    } catch (error) {
      console.error("Error loading student data:", error)
      setStudents([])
    }
  }, [])

  const selectedStudentData = students?.find((s) => s?.userId === selectedStudent) || null

  const getClassStats = () => {
    try {
      const safeStudents = students || []
      const totalStudents = safeStudents.length
      const activeStudents = safeStudents.filter(
        (s) =>
          s && s.lastActivity && new Date().getTime() - new Date(s.lastActivity).getTime() < 7 * 24 * 60 * 60 * 1000,
      ).length
      const avgProgress =
        totalStudents > 0
          ? safeStudents.reduce((acc, s) => acc + (s?.completedLessons?.length || 0), 0) / totalStudents
          : 0
      const avgScore =
        totalStudents > 0
          ? safeStudents.reduce((acc, s) => {
              const scores = Object.values(s?.scores || {})
              return acc + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0)
            }, 0) / totalStudents
          : 0

      return { totalStudents, activeStudents, avgProgress, avgScore }
    } catch (error) {
      console.error("Error calculating class stats:", error)
      return { totalStudents: 0, activeStudents: 0, avgProgress: 0, avgScore: 0 }
    }
  }

  const loadTeacherModels = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_models")
        .select("*")
        .eq("teacher_id", currentUser.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTeacherModels(data || [])
    } catch (error) {
      console.error("Error loading teacher models:", error)
      // Load sample models as fallback
      setTeacherModels([
        {
          id: "sample_1",
          name: "Basic Cube",
          description: "A simple cube for learning basic 3D concepts",
          category: "basic-shapes",
          difficulty_level: "beginner",
          learning_objectives: ["Understand 3D coordinates", "Learn basic shapes"],
          created_at: new Date().toISOString(),
          file_url: "/placeholder.svg?height=100&width=100",
          view_count: 12,
          download_count: 5,
        },
        {
          id: "sample_2",
          name: "Complex Gear",
          description: "An advanced mechanical gear model",
          category: "mechanical",
          difficulty_level: "advanced",
          learning_objectives: ["Mechanical design", "Complex geometry"],
          created_at: new Date().toISOString(),
          file_url: "/placeholder.svg?height=100&width=100",
          view_count: 8,
          download_count: 3,
        },
      ])
    }
  }

  const handleModelUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile || !currentUser) return

    setUploading(true)
    setUploadStatus({ type: null, message: "" })

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("teacherId", currentUser.id)

      const form = event.currentTarget
      const formDataFromForm = new FormData(form)
      formData.append("modelName", formDataFromForm.get("modelName") as string)
      formData.append("description", formDataFromForm.get("description") as string)
      formData.append("category", formDataFromForm.get("category") as string)
      formData.append("difficulty", formDataFromForm.get("difficulty") as string)
      formData.append("objectives", formDataFromForm.get("objectives") as string)

      const response = await fetch("/api/upload-model", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      if (result.success) {
        setTeacherModels((prev) => [result.model, ...prev])
        setSelectedFile(null)
        form.reset()

        setUploadStatus({
          type: "success",
          message: result.isDemo
            ? "Model uploaded successfully in demo mode! Configure BLOB_READ_WRITE_TOKEN for full functionality."
            : "Model uploaded successfully!",
        })
      }
    } catch (error) {
      console.error("Error uploading model:", error)
      setUploadStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  const deleteModel = async (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return

    try {
      if (modelId.startsWith("sample_") || modelId.startsWith("demo_")) {
        // Remove from local state
        setTeacherModels((prev) => prev.filter((m) => m.id !== modelId))
        return
      }

      const { error } = await supabase.from("teacher_models").update({ is_active: false }).eq("id", modelId)

      if (error) throw error
      setTeacherModels((prev) => prev.filter((m) => m.id !== modelId))
    } catch (error) {
      console.error("Error deleting model:", error)
      // Remove from local state anyway for demo
      setTeacherModels((prev) => prev.filter((m) => m.id !== modelId))
    }
  }

  const stats = getClassStats()

  useEffect(() => {
    if (currentUser) {
      loadTeacherModels()
    }
  }, [currentUser])

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading teacher dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Teacher Dashboard</h2>
        <p className="text-gray-600">Monitor student progress and manage your class</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeStudents}</p>
                <p className="text-sm text-gray-600">Active This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgProgress.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgScore.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Class Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Progress</TabsTrigger>
          <TabsTrigger value="models">Teaching Models</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Progress Overview</CardTitle>
              <CardDescription>Track how your students are progressing through the curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students && students.length > 0 ? (
                  students.map((student) => {
                    if (!student || !student.userId) return null
                    return (
                      <div key={student.userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-8 h-8 text-gray-400" />
                          <div>
                            <p className="font-medium">{student.userName || "Unknown Student"}</p>
                            <p className="text-sm text-gray-600">
                              Last active:{" "}
                              {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : "Never"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">{student.completedLessons?.length || 0}/3</p>
                            <p className="text-xs text-gray-600">Lessons</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{student.completedExercises?.length || 0}/2</p>
                            <p className="text-xs text-gray-600">Exercises</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{Math.round((student.totalTimeSpent || 0) / 60)}h</p>
                            <p className="text-xs text-gray-600">Time</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student.userId)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No students enrolled yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {selectedStudentData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedStudentData.userName}</CardTitle>
                  <CardDescription>Detailed progress report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Lesson Progress</p>
                      <Progress value={((selectedStudentData.completedLessons?.length || 0) / 3) * 100} />
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedStudentData.completedLessons?.length || 0} of 3 completed
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Exercise Progress</p>
                      <Progress value={((selectedStudentData.completedExercises?.length || 0) / 2) * 100} />
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedStudentData.completedExercises?.length || 0} of 2 completed
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Time Spent</p>
                      <p className="text-2xl font-bold">
                        {Math.round((selectedStudentData.totalTimeSpent || 0) / 60)} hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exercise Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedStudentData.scores && Object.keys(selectedStudentData.scores).length > 0 ? (
                      Object.entries(selectedStudentData.scores).map(([exercise, score]) => (
                        <div key={exercise} className="flex justify-between items-center">
                          <span className="text-sm">{exercise.replace("_", " ").toUpperCase()}</span>
                          <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                            {score}%
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No exercises completed yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Select a student from the overview to view detailed progress</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {uploadStatus.type && (
            <Alert
              className={
                uploadStatus.type === "success"
                  ? "border-green-200 bg-green-50"
                  : uploadStatus.type === "error"
                    ? "border-red-200 bg-red-50"
                    : ""
              }
            >
              {uploadStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className={uploadStatus.type === "success" ? "text-green-800" : ""}>
                {uploadStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Model</CardTitle>
                <CardDescription>Share 3D models with your students for exercises and learning</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleModelUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Model File (STL)</label>
                    <input
                      type="file"
                      accept=".stl"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Model Name</label>
                    <input
                      name="modelName"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Basic Cube Exercise"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      className="w-full p-2 border rounded-md h-20"
                      placeholder="Describe what students should learn from this model..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select name="category" className="w-full p-2 border rounded-md">
                        <option value="basic-shapes">Basic Shapes</option>
                        <option value="advanced-geometry">Advanced Geometry</option>
                        <option value="mechanical">Mechanical Parts</option>
                        <option value="artistic">Artistic Models</option>
                        <option value="exercise">Exercise Models</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Difficulty</label>
                      <select name="difficulty" className="w-full p-2 border rounded-md">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Learning Objectives (comma-separated)</label>
                    <input
                      name="objectives"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Understand basic shapes, Learn scaling, Practice measurements"
                    />
                  </div>
                  <Button type="submit" disabled={uploading || !selectedFile} className="w-full">
                    {uploading ? "Uploading..." : "Upload Model"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Teaching Models</CardTitle>
                <CardDescription>Manage models available to your students</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {teacherModels.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No models uploaded yet</p>
                      <p className="text-sm text-gray-400">Upload your first model to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teacherModels.map((model) => (
                        <div key={model.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{model.name}</h4>
                              <p className="text-sm text-gray-600">{model.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteModel(model.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {model.view_count || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {model.download_count || 0} downloads
                            </span>
                            <Badge variant="outline">{model.difficulty_level}</Badge>
                            <Badge variant="secondary">{model.category}</Badge>
                          </div>
                          {model.learning_objectives && model.learning_objectives.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Learning Objectives:</p>
                              <div className="flex flex-wrap gap-1">
                                {model.learning_objectives.map((obj: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {obj}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Assignment</CardTitle>
              <CardDescription>Assign specific lessons or exercises to your students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Assignment creation feature coming soon. You'll be able to:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Create custom lesson sequences</li>
                  <li>• Set due dates for assignments</li>
                  <li>• Track completion rates</li>
                  <li>• Provide feedback on student work</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
