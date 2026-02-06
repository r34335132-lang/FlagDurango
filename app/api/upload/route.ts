import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "uploads"

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No se proporcionó archivo" },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Tipo de archivo no permitido. Solo se permiten JPG, PNG, WebP y PDF" },
        { status: 400 }
      )
    }

    // Validar tamaño (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "El archivo es muy grande. Máximo 10MB" },
        { status: 400 }
      )
    }

    // Generar nombre único
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: "Archivo subido exitosamente",
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { success: false, message: "Error al subir el archivo" },
      { status: 500 }
    )
  }
}
