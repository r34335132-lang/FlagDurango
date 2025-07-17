import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 Fetching players...")

    const { data: players, error } = await supabase
      .from("players")
      .select(`
        *,
        team:teams(id, name, category, color1, color2)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching players:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${players?.length || 0} players`)
    return NextResponse.json({ success: true, data: players || [] })
  } catch (error) {
    console.error("💥 Error in players GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new player...")
    const body = await request.json()
    console.log("📋 Player data:", body)

    const { name, team_id, position, jersey_number, birth_date, phone, email } = body

    if (!name || !team_id || !position || !jersey_number) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Nombre, equipo, posición y número de jersey son requeridos",
        },
        { status: 400 },
      )
    }

    // Verificar si el número de jersey ya existe en el equipo
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("team_id", team_id)
      .eq("jersey_number", jersey_number)
      .single()

    if (existingPlayer) {
      console.log("❌ Jersey number already exists in team")
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un jugador con ese número en el equipo",
        },
        { status: 400 },
      )
    }

    const { data: player, error } = await supabase
      .from("players")
      .insert([
        {
          name,
          team_id: Number.parseInt(team_id),
          position,
          jersey_number: Number.parseInt(jersey_number),
          birth_date: birth_date || null,
          phone: phone || null,
          email: email || null,
          status: "active",
        },
      ])
      .select(`
        *,
        team:teams(id, name, category, color1, color2)
      `)
      .single()

    if (error) {
      console.error("❌ Error creating player:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Player created successfully:", player.id)
    return NextResponse.json({ success: true, data: player })
  } catch (error) {
    console.error("💥 Error in players POST:", error)
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

    console.log("🗑️ Deleting player:", id)

    const { error } = await supabase.from("players").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting player:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Player deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Jugador eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in players DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
