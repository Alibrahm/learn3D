"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, Heart, Download, Calendar, User } from "lucide-react"

interface SavedProject {
  id: string
  name: string
  shapes: any[]
  createdAt: Date | string
  thumbnail?: string
  likes: number
  views: number
  creator: string
}

interface ProjectGalleryProps {
  projects: SavedProject[]
  onLoadProject: (project: SavedProject) => void
  onDeleteProject: (id: string) => void
}

export function ProjectGallery({ projects, onLoadProject, onDeleteProject }: ProjectGalleryProps) {
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null)

  const formatDate = (date: Date | string | undefined) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date || Date.now())
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Unknown date"
    }
  }

  const safeProjects = projects || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Your 3D Creations
          </CardTitle>
          <CardDescription>Review and manage your saved 3D projects</CardDescription>
        </CardHeader>
      </Card>

      {safeProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Start creating your first 3D project!</p>
            <Button>Create New Project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeProjects.map((project) => {
            if (!project || !project.id) return null

            return (
              <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate">{project.name || "Untitled"}</span>
                    <Badge variant="outline" className="text-xs">
                      {project.shapes?.length || 0} shapes
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {project.creator || "Unknown"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Project Preview */}
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-600">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">3D Preview</p>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {project.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {project.likes}
                      </span>
                    </div>

                    {/* Shape Summary */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Shapes used:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(project.shapes.map((s) => s.type))).map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button onClick={() => onLoadProject(project)} className="flex-1" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                      <Button onClick={() => setSelectedProject(project)} variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedProject.name}</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)}>
                ✕
              </Button>
            </CardTitle>
            <CardDescription>
              Created {formatDate(selectedProject.createdAt)} • {selectedProject.shapes.length} shapes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Project Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Creator:</span>
                      <p className="font-medium">{selectedProject.creator}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Shapes:</span>
                      <p className="font-medium">{selectedProject.shapes.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Views:</span>
                      <p className="font-medium">{selectedProject.views}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Likes:</span>
                      <p className="font-medium">{selectedProject.likes}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Shape Breakdown</h4>
                  <div className="space-y-2">
                    {selectedProject.shapes.map((shape, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: shape.color }} />
                          <span className="text-sm">{shape.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {shape.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  onLoadProject(selectedProject)
                  setSelectedProject(null)
                }}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Open in Builder
              </Button>
              <Button
                onClick={() => {
                  onDeleteProject(selectedProject.id)
                  setSelectedProject(null)
                }}
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
