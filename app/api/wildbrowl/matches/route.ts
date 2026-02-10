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
        participant1_score,
        participant2_score,
        winner_id,
        scheduled_time,
        status,
        round,
        bracket_type,
        match_number,
        elimination_match,
        created_at,
        participant1:wildbrowl_participants!participant1_id(
          id,
          player_name,
          category,
          alias
        ),
        participant2:wildbrowl_participants!participant2_id(
          id,
          player_name,
          category,
          alias
        ),
        winner:wildbrowl_participants!winner_id(
          id,
          player_name,
          alias
        )
      `)
      .eq("tournament_id", 1)
      .order("round", { ascending: true })
      .order("match_number", { ascending: true })

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
    const { participant1_id, participant2_id, round, bracket_type, scheduled_time } = await request.json()

    if (!participant1_id || !participant2_id || !round) {
      return NextResponse.json(
        { success: false, error: "participant1_id, participant2_id y round son requeridos" },
        { status: 400 },
      )
    }

    // Validar que los participantes existan y estén pagados
    const { data: participants, error: participantsError } = await supabase
      .from("wildbrowl_participants")
      .select("id, player_name, category, is_paid")
      .in("id", [participant1_id, participant2_id])

    if (participantsError) {
      console.error("Error validating participants:", participantsError)
      return NextResponse.json({ success: false, error: participantsError.message }, { status: 500 })
    }

    if (!participants || participants.length !== 2) {
      return NextResponse.json({ success: false, error: "Uno o ambos participantes no existen" }, { status: 400 })
    }

    const participant1 = participants.find((p) => p.id === participant1_id)
    const participant2 = participants.find((p) => p.id === participant2_id)

    if (!participant1?.is_paid || !participant2?.is_paid) {
      return NextResponse.json(
        { success: false, error: "Ambos participantes deben tener el pago confirmado" },
        { status: 400 },
      )
    }

    if (participant1.category !== participant2.category) {
      return NextResponse.json(
        { success: false, error: "Los participantes deben ser de la misma categoría" },
        { status: 400 },
      )
    }

    // Obtener el siguiente número de partido para la ronda
    const { data: existingMatches } = await supabase
      .from("wildbrowl_matches")
      .select("match_number")
      .eq("tournament_id", 1)
      .eq("round", round)
      .eq("bracket_type", bracket_type || "winners")
      .order("match_number", { ascending: false })
      .limit(1)

    const nextMatchNumber = existingMatches && existingMatches.length > 0 ? existingMatches[0].match_number + 1 : 1

    const insertData = {
      tournament_id: 1,
      participant1_id,
      participant2_id,
      round,
      bracket_type: bracket_type || "winners",
      status: "programado",
      match_number: nextMatchNumber,
      participant1_score: 0,
      participant2_score: 0,
      elimination_match: bracket_type === "losers",
      scheduled_time: scheduled_time || null,
    }

    const { data: match, error } = await supabase
      .from("wildbrowl_matches")
      .insert([insertData])
      .select(`
        *,
        participant1:wildbrowl_participants!participant1_id(player_name, category, alias),
        participant2:wildbrowl_participants!participant2_id(player_name, category, alias)
      `)
      .single()

    if (error) {
      console.error("Error creating match:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: match,
      message: "Partido creado exitosamente",
    })
  } catch (error) {
    console.error("Error in matches POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, participant1_score, participant2_score, status, scheduled_time } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    const updateData: any = {}

    if (participant1_score !== undefined) updateData.participant1_score = participant1_score
    if (participant2_score !== undefined) updateData.participant2_score = participant2_score
    if (status) updateData.status = status
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time

    // Si se están actualizando los puntajes y el estado es finalizado, determinar el ganador
    if (status === "finalizado" && participant1_score !== undefined && participant2_score !== undefined) {
      if (participant1_score > participant2_score) {
        const { data: match } = await supabase.from("wildbrowl_matches").select("participant1_id").eq("id", id).single()
        if (match) updateData.winner_id = match.participant1_id
      } else if (participant2_score > participant1_score) {
        const { data: match } = await supabase.from("wildbrowl_matches").select("participant2_id").eq("id", id).single()
        if (match) updateData.winner_id = match.participant2_id
      }
    }

    const { data: match, error } = await supabase
      .from("wildbrowl_matches")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        participant1:wildbrowl_participants!participant1_id(player_name, category, alias),
        participant2:wildbrowl_participants!participant2_id(player_name, category, alias),
        winner:wildbrowl_participants!winner_id(player_name, alias)
      `)
      .single()

    if (error) {
      console.error("Error updating match:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Auto-advance: cuando todos los partidos de una ronda estan finalizados,
    // generar los partidos de la siguiente ronda SI no existen ya
    if (status === "finalizado" && match?.winner_id) {
      try {
        const currentRound = match.round
        const tournamentId = match.tournament_id
        const bracketType = match.bracket_type

        const roundProgression: Record<string, string> = {
          "32avos": "16avos",
          "16avos": "octavos",
          octavos: "cuartos",
          cuartos: "semifinal",
          semifinal: "final",
        }
        const nextRound = roundProgression[currentRound]

        if (nextRound) {
          // Obtener todos los partidos de esta ronda
          const { data: roundMatches } = await supabase
            .from("wildbrowl_matches")
            .select("id, winner_id, status")
            .eq("tournament_id", tournamentId)
            .eq("round", currentRound)
            .eq("bracket_type", bracketType)

          const allFinished = roundMatches?.every((m) => m.status === "finalizado")

          if (allFinished && roundMatches && roundMatches.length > 0) {
            // Verificar que NO existan ya partidos en la siguiente ronda
            const { data: existingNext } = await supabase
              .from("wildbrowl_matches")
              .select("id")
              .eq("tournament_id", tournamentId)
              .eq("round", nextRound)
              .eq("bracket_type", bracketType)

            if (!existingNext || existingNext.length === 0) {
              const winners = roundMatches.map((m) => m.winner_id).filter(Boolean)
              const nextMatches = []
              for (let i = 0; i < winners.length; i += 2) {
                if (i + 1 < winners.length) {
                  nextMatches.push({
                    tournament_id: tournamentId,
                    participant1_id: winners[i],
                    participant2_id: winners[i + 1],
                    round: nextRound,
                    bracket_type: bracketType,
                    status: "programado",
                    match_number: Math.floor(i / 2) + 1,
                    participant1_score: 0,
                    participant2_score: 0,
                    elimination_match: false,
                  })
                }
              }
              if (nextMatches.length > 0) {
                await supabase.from("wildbrowl_matches").insert(nextMatches)
              }
            }
          }
        }
      } catch (advErr) {
        console.error("Error auto-advancing round:", advErr)
      }
    }

    return NextResponse.json({ success: true, data: match })
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

    // Verificar que el partido no esté finalizado
    const { data: match } = await supabase.from("wildbrowl_matches").select("status").eq("id", id).single()

    if (match?.status === "finalizado") {
      return NextResponse.json({ success: false, error: "No se puede eliminar un partido finalizado" }, { status: 400 })
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
