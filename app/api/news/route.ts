import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 Fetching news...")

    const { data: news, error } = await supabase.from("news").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching news:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${news?.length || 0} news articles`)
    return NextResponse.json({ success: true, data: news || [] })
  } catch (error) {
    console.error("💥 Error in news GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new news article...")
    const body = await request.json()
    console.log("📋 News data:", body)

    const { title, content, author, image_url } = body

    if (!title || !content) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Título y contenido son requeridos",
        },
        { status: 400 },
      )
    }

    const { data: article, error } = await supabase
      .from("news")
      .insert([
        {
          title,
          content,
          author: author || "Admin",
          image_url: image_url || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating news:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ News article created successfully:", article.id)
    return NextResponse.json({
      success: true,
      article,
      message: "Noticia creada exitosamente",
    })
  } catch (error) {
    console.error("💥 Error in news POST:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    console.log("🗑️ Deleting news article:", id)

    const { error } = await supabase.from("news").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting news:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ News article deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Noticia eliminada exitosamente" })
  } catch (error) {
    console.error("💥 Error in news DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
