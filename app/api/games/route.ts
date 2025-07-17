import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 Fetching games...")

    const { data: games, error } = await supabase
      .from("games")
      .select("*")
      .order("game_date", { ascending: true })
      .order("game_time", { ascending: true })

    if (error) {
      console.error("❌ Error fetching games:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${games?.length || 0} games`)
    return NextResponse.json({ success: true, data: games || [] })
  } catch (error) {
    console.error("💥 Error in games GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new game...")
    const body = await request.json()
    console.log("📋 Game data:", body)

    const {
      home_team,
      away_team,
      game_date,
      game_time,
      venue,
      field,
      category,
      referee1,
      referee2,
      status = "programado",
    } = body

    if (!home_team || !away_team || !game_date || !game_time || !venue || !field || !category) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Todos los campos son requeridos",
        },
        { status: 400 },
      )
    }

    if (home_team === away_team) {
      return NextResponse.json(
        {
          success: false,
          message: "Un equipo no puede jugar contra sí mismo",
        },
        { status: 400 },
      )
    }

    const { data: game, error } = await supabase
      .from("games")
      .insert([
        {
          home_team,
          away_team,
          game_date,
          game_time,
          venue,
          field,
          category,
          referee1: referee1 || null,
          referee2: referee2 || null,
          status,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating game:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Game created successfully:", game.id)
    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error("💥 Error in games POST:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("📝 Updating game...")
    const body = await request.json()
    console.log("📋 Update data:", body)

    const { id, status, home_score, away_score, mvp } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    const updateData: any = {}

    if (status) updateData.status = status
    if (home_score !== undefined) updateData.home_score = home_score
    if (away_score !== undefined) updateData.away_score = away_score
    if (mvp) updateData.mvp = mvp

    const { data: game, error } = await supabase.from("games").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ Error updating game:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Game updated successfully:", game.id)
    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error("💥 Error in games PUT:", error)
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

    console.log("🗑️ Deleting game:", id)

    const { error } = await supabase.from("games").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting game:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Game deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Partido eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in games DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
