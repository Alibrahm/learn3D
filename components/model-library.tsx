"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye } from "lucide-react"

interface Model {
  name: string
  url: string
  id: string
}

interface ModelLibraryProps {
  models: Model[]
  onModelSelect: (modelUrl: string) => void
  currentModel: string | null
}

export function ModelLibrary({ models, onModelSelect, currentModel }: ModelLibraryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Model Library</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {models.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No models uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    currentModel === model.url ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{model.name}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onModelSelect(model.url)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
