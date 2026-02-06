import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

// GET - Fetch attendance for a specific game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("game_id")
    const playerId = searchParams.get("player_id")

    if (!gameId && !playerId) {
      return NextResponse.json(
        { success: false, message: "game_id o player_id es requerido" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("game_attendance")
      .select("id, game_id, player_id, attended, created_at, updated_at")

    if (gameId) {
      query = query.eq("game_id", Number(gameId))
    }

    if (playerId) {
      query = query.eq("player_id", Number(playerId))
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendance:", error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error("GET /api/attendance error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error interno" },
      { status: 500 }
    )
  }
}

// POST - Upsert attendance (create or update)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { game_id, player_id, attended } = body

    if (!game_id || !player_id || attended === undefined) {
      return NextResponse.json(
        { success: false, message: "game_id, player_id y attended son requeridos" },
        { status: 400 }
      )
    }

    // Check if record already exists
    const { data: existing } = await supabase
      .from("game_attendance")
      .select("id")
      .eq("game_id", Number(game_id))
      .eq("player_id", Number(player_id))
      .maybeSingle()

    let data, error

    if (existing) {
      // Update existing record
      const result = await supabase
        .from("game_attendance")
        .update({ attended, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new record
      const result = await supabase
        .from("game_attendance")
        .insert({ game_id: Number(game_id), player_id: Number(player_id), attended })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("Error saving attendance:", error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("POST /api/attendance error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error interno" },
      { status: 500 }
    )
  }
}

// PUT - Bulk update attendance for a game
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { game_id, attendance } = body as {
      game_id: number
      attendance: { player_id: number; attended: boolean }[]
    }

    if (!game_id || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { success: false, message: "game_id y attendance array son requeridos" },
        { status: 400 }
      )
    }

    // Process each attendance record
    const results = []
    for (const record of attendance) {
      const { data: existing } = await supabase
        .from("game_attendance")
        .select("id")
        .eq("game_id", Number(game_id))
        .eq("player_id", Number(record.player_id))
        .maybeSingle()

      if (existing) {
        const { data, error } = await supabase
          .from("game_attendance")
          .update({ attended: record.attended, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single()
        if (error) throw error
        results.push(data)
      } else {
        const { data, error } = await supabase
          .from("game_attendance")
          .insert({
            game_id: Number(game_id),
            player_id: Number(record.player_id),
            attended: record.attended,
          })
          .select()
          .single()
        if (error) throw error
        results.push(data)
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    console.error("PUT /api/attendance error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Error interno" },
      { status: 500 }
    )
  }
}
