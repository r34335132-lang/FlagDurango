import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: matches, error } = await supabase
      .from("wildbrowl_matches")
      .select(`
        id,
        tournament_id,
        participant1_id,
        participant2_id,
        player_a,
        player_b,
        scheduled_date,
        scheduled_time,
        status,
        score_a,
        score_b,
        round,
        category,
        winner,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching matches:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: matches || [] })
  } catch (error) {
    console.error("Error in matches GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { player_a, player_b, scheduled_date, scheduled_time, round, category } = await request.json()

    if (!player_a || !player_b || !round || !category) {
      return NextResponse.json(
        { success: false, error: "player_a, player_b, round y category son requeridos" },
        { status: 400 },
      )
    }

    // Validar categoría
    if (!["varonil", "femenil", "mixto"].includes(category)) {
      return NextResponse.json(
        { success: false, error: "Categoría debe ser 'varonil', 'femenil' o 'mixto'" },
        { status: 400 },
      )
    }

    // Validar ronda
    const validRounds = ["octavos", "cuartos", "semifinal", "final", "champion_of_champions"]
    if (!validRounds.includes(round)) {
      return NextResponse.json(
        { success: false, error: "Ronda debe ser: octavos, cuartos, semifinal, final o champion_of_champions" },
        { status: 400 },
      )
    }

    // Buscar participant_ids por nombre
    const { data: participant1 } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("player_name", player_a)
      .eq("tournament_id", 1)
      .single()

    const { data: participant2 } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("player_name", player_b)
      .eq("tournament_id", 1)
      .single()

    const { data: match, error } = await supabase
      .from("wildbrowl_matches")
      .insert([
        {
          tournament_id: 1,
          participant1_id: participant1?.id || null,
          participant2_id: participant2?.id || null,
          player_a,
          player_b,
          scheduled_date: scheduled_date || null,
          scheduled_time: scheduled_time || null,
          status: "programado",
          round,
          category,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating match:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: match })
  } catch (error) {
    console.error("Error in matches POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, score_a, score_b, status, scheduled_date, scheduled_time, winner } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    const updateData: any = {}
    if (score_a !== undefined) updateData.score_a = score_a
    if (score_b !== undefined) updateData.score_b = score_b
    if (status) updateData.status = status
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time
    if (winner) updateData.winner = winner

    // Si se proporcionan scores, determinar ganador automáticamente
    if (score_a !== undefined && score_b !== undefined && !winner) {
      const { data: match } = await supabase
        .from("wildbrowl_matches")
        .select("player_a, player_b")
        .eq("id", id)
        .single()

      if (match) {
        updateData.winner = score_a > score_b ? match.player_a : match.player_b
        updateData.status = "finalizado"
      }
    }

    const { data: updatedMatch, error } = await supabase
      .from("wildbrowl_matches")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating match:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedMatch })
  } catch (error) {
    console.error("Error in matches PUT:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    const { error } = await supabase.from("wildbrowl_matches").delete().eq("id", id)

    if (error) {
      console.error("Error deleting match:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Partido eliminado correctamente" })
  } catch (error) {
    console.error("Error in matches DELETE:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
