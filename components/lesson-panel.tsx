"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Target, CheckCircle, Info } from "lucide-react"

interface LessonPanelProps {
  currentModel: string | null
}

export function LessonPanel({ currentModel }: LessonPanelProps) {
  const lessons = [
    {
      id: 1,
      title: "Basic 3D Geometry",
      description: "Understanding vertices, edges, and faces",
      completed: true,
      difficulty: "Beginner",
    },
    {
      id: 2,
      title: "Surface Analysis",
      description: "Analyzing surface quality and topology",
      completed: false,
      difficulty: "Intermediate",
    },
    {
      id: 3,
      title: "Design Optimization",
      description: "Optimizing models for 3D printing",
      completed: false,
      difficulty: "Advanced",
    },
  ]

  const analysisPoints = [
    "Model appears to be manifold (watertight)",
    "Surface normals are consistent",
    "No obvious geometric errors detected",
    "Suitable for 3D printing applications",
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>33%</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>

            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{lesson.title}</h4>
                    {lesson.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Target className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{lesson.description}</p>
                  <Badge
                    variant={
                      lesson.difficulty === "Beginner"
                        ? "default"
                        : lesson.difficulty === "Intermediate"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {lesson.difficulty}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {currentModel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5" />
              Model Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Use mouse controls to examine all angles</p>
            <p>• Look for surface defects and holes</p>
            <p>• Check wall thickness for printing</p>
            <p>• Verify model scale and dimensions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
