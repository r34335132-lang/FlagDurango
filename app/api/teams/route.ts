import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 Fetching teams...")

    const { data: teams, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching teams:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${teams?.length || 0} teams`)
    return NextResponse.json({ success: true, data: teams || [] })
  } catch (error) {
    console.error("💥 Error in teams GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new team...")
    const body = await request.json()
    console.log("📋 Team data:", body)

    const {
      name,
      category,
      color1,
      color2,
      logo_url,
      captain_name,
      captain_phone,
      contact_name,
      contact_phone,
      contact_email,
    } = body

    if (!name || !category) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Nombre y categoría son requeridos",
        },
        { status: 400 },
      )
    }

    // Verificar si ya existe un equipo con el mismo nombre
    const { data: existingTeam } = await supabase.from("teams").select("id").eq("name", name).single()

    if (existingTeam) {
      console.log("❌ Team name already exists")
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un equipo con ese nombre",
        },
        { status: 400 },
      )
    }

    const { data: team, error } = await supabase
      .from("teams")
      .insert([
        {
          name,
          category,
          color1: color1 || "#3B82F6",
          color2: color2 || "#1E40AF",
          logo_url: logo_url || null,
          captain_name: captain_name || null,
          captain_phone: captain_phone || null,
          contact_name: contact_name || captain_name || "Sin contacto",
          contact_phone: contact_phone || captain_phone || "Sin teléfono",
          contact_email: contact_email || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating team:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Team created successfully:", team.id)
    return NextResponse.json({ success: true, data: team })
  } catch (error) {
    console.error("💥 Error in teams POST:", error)
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

    console.log("🗑️ Deleting team:", id)

    // Verificar si el equipo tiene jugadores
    const { data: players, error: playersError } = await supabase.from("players").select("id").eq("team_id", id)

    if (playersError) {
      console.error("❌ Error checking players:", playersError)
      return NextResponse.json({ success: false, message: "Error al verificar jugadores" }, { status: 500 })
    }

    if (players && players.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No se puede eliminar el equipo porque tiene jugadores registrados",
        },
        { status: 400 },
      )
    }

    // Eliminar el equipo
    const { error } = await supabase.from("teams").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting team:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Team deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Equipo eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in teams DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
