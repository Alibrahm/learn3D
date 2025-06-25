"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, BookOpen } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { logger, logUserAction } from "@/utils/logger"

interface TeacherModel {
  id: string
  name: string
  description: string
  file_url: string
  category: string
  difficulty_level: "beginner" | "intermediate" | "advanced"
  learning_objectives: string[]
  created_at: string
  teacher_name: string
  view_count: number
  download_count: number
}

interface TeacherModelGalleryProps {
  onModelSelect: (modelUrl: string, modelData: TeacherModel) => void
  currentModel?: string | null
}

export function TeacherModelGallery({ onModelSelect, currentModel }: TeacherModelGalleryProps) {
  const [models, setModels] = useState<TeacherModel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")

  const categories = ["all", "basic-shapes", "mechanical-parts", "architectural", "organic", "educational"]
  const difficulties = ["all", "beginner", "intermediate", "advanced"]

  useEffect(() => {
    loadTeacherModels()
  }, [])

  const loadTeacherModels = async () => {
    try {
      setLoading(true)
      logger.info("teacher_models", "Loading teacher models")

      // Use only the columns that exist in the current schema
      const { data, error } = await supabase
        .from("teacher_models")
        .select(`
          id,
          name,
          description,
          file_url,
          category,
          difficulty_level,
          learning_objectives,
          created_at,
          teacher_id
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        logger.error("teacher_models", "Failed to load teacher models", error)
        // Use mock data as fallback
        setMockData()
        return
      }

      // Transform the data to include default values for missing fields
      const transformedModels: TeacherModel[] = (data || []).map((model) => ({
        ...model,
        teacher_name: "Teacher", // Default teacher name
        view_count: 0, // Default view count
        download_count: 0, // Default download count
        learning_objectives: model.learning_objectives || [],
      }))

      setModels(transformedModels)
      logger.info("teacher_models", "Teacher models loaded successfully", { count: transformedModels.length })
    } catch (error) {
      logger.error("teacher_models", "Error loading teacher models", error)
      setMockData()
    } finally {
      setLoading(false)
    }
  }

  const setMockData = () => {
    // Provide sample models for demonstration
    const mockModels: TeacherModel[] = [
      {
        id: "sample-1",
        name: "Basic Cube",
        description:
          "A fundamental 3D shape perfect for learning basic geometry concepts and understanding coordinate systems.",
        file_url: "/placeholder.svg?height=200&width=200",
        category: "basic-shapes",
        difficulty_level: "beginner",
        learning_objectives: [
          "Understand 3D coordinate systems",
          "Learn basic geometric properties",
          "Practice spatial visualization",
        ],
        created_at: new Date().toISOString(),
        teacher_name: "Prof. Smith",
        view_count: 45,
        download_count: 12,
      },
      {
        id: "sample-2",
        name: "Mechanical Gear",
        description: "An intricate gear model designed to teach mechanical engineering principles and gear ratios.",
        file_url: "/placeholder.svg?height=200&width=200",
        category: "mechanical-parts",
        difficulty_level: "intermediate",
        learning_objectives: [
          "Understand gear mechanisms",
          "Learn about mechanical advantage",
          "Study rotational motion",
        ],
        created_at: new Date().toISOString(),
        teacher_name: "Dr. Johnson",
        view_count: 78,
        download_count: 23,
      },
      {
        id: "sample-3",
        name: "Architectural Column",
        description: "A classical architectural column showcasing design principles and structural elements.",
        file_url: "/placeholder.svg?height=200&width=200",
        category: "architectural",
        difficulty_level: "intermediate",
        learning_objectives: [
          "Study architectural proportions",
          "Understand structural design",
          "Learn classical orders",
        ],
        created_at: new Date().toISOString(),
        teacher_name: "Prof. Davis",
        view_count: 34,
        download_count: 8,
      },
      {
        id: "sample-4",
        name: "Organic Shell",
        description: "A natural shell form demonstrating organic shapes and biomimetic design principles.",
        file_url: "/placeholder.svg?height=200&width=200",
        category: "organic",
        difficulty_level: "advanced",
        learning_objectives: ["Explore organic forms", "Study natural patterns", "Learn biomimetic design"],
        created_at: new Date().toISOString(),
        teacher_name: "Dr. Wilson",
        view_count: 56,
        download_count: 15,
      },
      {
        id: "sample-5",
        name: "Educational Puzzle",
        description: "An interactive 3D puzzle designed to enhance problem-solving and spatial reasoning skills.",
        file_url: "/placeholder.svg?height=200&width=200",
        category: "educational",
        difficulty_level: "beginner",
        learning_objectives: [
          "Develop problem-solving skills",
          "Enhance spatial reasoning",
          "Practice logical thinking",
        ],
        created_at: new Date().toISOString(),
        teacher_name: "Ms. Brown",
        view_count: 92,
        download_count: 31,
      },
    ]
    setModels(mockModels)
  }

  const handleModelClick = async (model: TeacherModel) => {
    try {
      logUserAction("teacher_model_selected", "learning", {
        modelId: model.id,
        modelName: model.name,
        category: model.category,
        difficulty: model.difficulty_level,
      })

      onModelSelect(model.file_url, model)
    } catch (error) {
      logger.error("teacher_models", "Error selecting model", error)
      // Still allow model selection even if logging fails
      onModelSelect(model.file_url, model)
    }
  }

  const handleDownload = async (model: TeacherModel, event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      // Create download link (for real files, this would download the actual STL)
      const link = document.createElement("a")
      link.href = model.file_url
      link.download = `${model.name}.stl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      logUserAction("teacher_model_downloaded", "learning", {
        modelId: model.id,
        modelName: model.name,
      })

      logger.info("teacher_models", "Model download initiated", {
        modelId: model.id,
        modelName: model.name,
      })
    } catch (error) {
      logger.error("teacher_models", "Error downloading model", error)
    }
  }

  const filteredModels = models.filter((model) => {
    const categoryMatch = selectedCategory === "all" || model.category === selectedCategory
    const difficultyMatch = selectedDifficulty === "all" || model.difficulty_level === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teacher Models</CardTitle>
          <CardDescription>Loading available models...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Teacher Models
        </CardTitle>
        <CardDescription>Explore 3D models uploaded by your teachers for learning and practice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty}
                variant={selectedDifficulty === difficulty ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDifficulty(difficulty)}
                className="text-xs"
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {filteredModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No models available with the selected filters</p>
              <p className="text-sm mt-2">Try adjusting your filter criteria</p>
            </div>
          ) : (
            filteredModels.map((model) => (
              <Card
                key={model.id}
                className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                  currentModel === model.file_url ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""
                }`}
                onClick={() => handleModelClick(model)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{model.name}</h4>
                    <Badge className={getDifficultyColor(model.difficulty_level)}>{model.difficulty_level}</Badge>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{model.description}</p>

                  {model.learning_objectives && model.learning_objectives.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Objectives:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {model.learning_objectives.slice(0, 2).map((objective, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                            <span className="line-clamp-1">{objective}</span>
                          </li>
                        ))}
                        {model.learning_objectives.length > 2 && (
                          <li className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                            +{model.learning_objectives.length - 2} more objectives...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {model.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {model.download_count}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>by {model.teacher_name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDownload(model, e)}
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        title="Download model"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredModels.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t">
            Showing {filteredModels.length} of {models.length} models
          </div>
        )}
      </CardContent>
    </Card>
  )
}
