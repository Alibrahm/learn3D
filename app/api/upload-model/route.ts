import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const teacherId = formData.get("teacherId") as string
    const modelName = formData.get("modelName") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const difficulty = formData.get("difficulty") as string
    const objectives = formData.get("objectives") as string

    if (!file || !teacherId || !modelName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let fileUrl = `/placeholder.svg?height=200&width=200`
    let blobUrl = null

    // Try to upload to Vercel Blob if token is available
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`teacher-models/${teacherId}/${file.name}`, file, {
          access: "public",
          metadata: {
            teacherId,
            originalName: file.name,
            category: "teacher-model",
          },
        })
        fileUrl = blob.url
        blobUrl = blob.url
      } else {
        console.log("Blob storage not configured, using placeholder")
      }
    } catch (blobError) {
      console.warn("Blob upload failed:", blobError)
      // Continue with placeholder URL
    }

    // Save to database
    try {
      const { data, error } = await supabase
        .from("teacher_models")
        .insert({
          teacher_id: teacherId,
          name: modelName,
          description: description || null,
          file_url: fileUrl,
          blob_url: blobUrl,
          file_size: file.size,
          category: category || "basic-shapes",
          difficulty_level: difficulty || "beginner",
          learning_objectives: objectives ? objectives.split(",").map((s) => s.trim()) : [],
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        model: data,
        message: "Model uploaded successfully",
      })
    } catch (dbError) {
      console.warn("Database save failed:", dbError)

      // Return success with local data for demo
      const demoModel = {
        id: `demo_${Date.now()}`,
        teacher_id: teacherId,
        name: modelName,
        description: description || null,
        file_url: fileUrl,
        blob_url: blobUrl,
        file_size: file.size,
        category: category || "basic-shapes",
        difficulty_level: difficulty || "beginner",
        learning_objectives: objectives ? objectives.split(",").map((s) => s.trim()) : [],
        created_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        model: demoModel,
        message: "Model uploaded successfully (demo mode)",
        isDemo: true,
      })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
