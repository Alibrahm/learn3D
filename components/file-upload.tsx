"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.toLowerCase().endsWith(".stl")) {
      onFileUpload(file)
    } else {
      alert("Please select a valid STL file")
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.name.toLowerCase().endsWith(".stl")) {
      onFileUpload(file)
    } else {
      alert("Please drop a valid STL file")
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">Drop STL files here or click to browse</p>
        <p className="text-xs text-gray-400">Supports .stl files up to 50MB</p>
      </div>

      <input ref={fileInputRef} type="file" accept=".stl" onChange={handleFileSelect} className="hidden" />

      <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
        <FileText className="w-4 h-4 mr-2" />
        Choose STL File
      </Button>
    </div>
  )
}
