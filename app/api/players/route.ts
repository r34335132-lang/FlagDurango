import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin" // Asegúrate de que esta importación sea correcta

export async function GET() {
  try {
    console.log("🔍 API Players: Fetching players...")

    const { data: players, error } = await supabase
      .from("players")
      .select(`
        *,
        team:teams(id, name, category, color1, color2)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ API Players: Error fetching players:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ API Players: Found ${players?.length || 0} players`)
    return NextResponse.json({ success: true, data: players || [] })
  } catch (error: any) {
    console.error("💥 API Players: Error in players GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor: " + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 API Players: Creating new player...")
    const body = await request.json()
    console.log("📋 API Players: Player data received:", body)

    const { name, team_id, position, jersey_number, birth_date, phone, email } = body

    if (!name || !team_id || !position || !jersey_number) {
      console.log("❌ API Players: Missing required fields for player creation.")
      return NextResponse.json(
        {
          success: false,
          message: "Nombre, equipo, posición y número de jersey son requeridos",
        },
        { status: 400 },
      )
    }

    // Verificar si el número de jersey ya existe en el equipo
    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from("players")
      .select("id")
      .eq("team_id", Number.parseInt(team_id)) // Asegúrate de que team_id sea un número
      .eq("jersey_number", Number.parseInt(jersey_number)) // Asegúrate de que jersey_number sea un número
      .single()

    if (existingPlayerError && existingPlayerError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      console.error("❌ API Players: Error checking existing player:", existingPlayerError)
      return NextResponse.json({ success: false, message: existingPlayerError.message }, { status: 500 })
    }

    if (existingPlayer) {
      console.log("❌ API Players: Jersey number already exists in team.")
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
      console.error("❌ API Players: Error creating player:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ API Players: Player created successfully:", player.id)
    return NextResponse.json({ success: true, data: player })
  } catch (error: any) {
    console.error("💥 API Players: Error in players POST:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor: " + error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      console.log("❌ API Players: ID is required for delete operation.")
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    console.log("🗑️ API Players: Deleting player:", id)

    const { error } = await supabase.from("players").delete().eq("id", id)

    if (error) {
      console.error("❌ API Players: Error deleting player:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ API Players: Player deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Jugador eliminado exitosamente" })
  } catch (error: any) {
    console.error("💥 API Players: Error in players DELETE:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor: " + error.message },
      { status: 500 },
    )
  }
}
