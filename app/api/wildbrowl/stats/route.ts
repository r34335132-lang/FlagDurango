import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const tournamentId = searchParams.get("tournament_id") || "1"

    // Obtener participantes con sus estadísticas
    let participantsQuery = supabase
      .from("wildbrowl_participants")
      .select(`
        id,
        player_name,
        email,
        phone,
        category,
        status,
        alias,
        image_url,
        created_at
      `)
      .eq("tournament_id", tournamentId)

    if (category) {
      participantsQuery = participantsQuery.eq("category", category)
    }

    const { data: participants, error: participantsError } = await participantsQuery

    if (participantsError) {
      console.error("Error fetching participants:", participantsError)
      return NextResponse.json({ success: false, error: participantsError.message }, { status: 500 })
    }

    // Obtener estadísticas existentes
    let statsQuery = supabase.from("wildbrowl_stats").select("*").eq("tournament_id", tournamentId)

    if (category) {
      statsQuery = statsQuery.in("participant_id", participants?.map((p) => p.id) || [])
    }

    const { data: existingStats, error: statsError } = await statsQuery

    if (statsError) {
      console.error("Error fetching stats:", statsError)
      return NextResponse.json({ success: false, error: statsError.message }, { status: 500 })
    }

    // Obtener matches para calcular estadísticas
    const { data: matches, error: matchesError } = await supabase
      .from("wildbrowl_matches")
      .select(`
        id,
        tournament_id,
        participant1_id,
        participant2_id,
        participant1_score,
        participant2_score,
        winner_id,
        status,
        bracket_type,
        elimination_match
      `)
      .eq("tournament_id", tournamentId)

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return NextResponse.json({ success: false, error: matchesError.message }, { status: 500 })
    }

    // Calcular estadísticas para cada participante
    const calculatedStats =
      participants?.map((participant) => {
        const participantMatches =
          matches?.filter((m) => m.participant1_id === participant.id || m.participant2_id === participant.id) || []

        const completedMatches = participantMatches.filter((m) => m.status === "finalizado" || m.status === "completed")

        const matchesPlayed = completedMatches.length
        let matchesWon = 0
        let matchesLost = 0
        let pointsScored = 0
        let pointsAgainst = 0
        let livesRemaining = 2 // Doble eliminación = 2 vidas
        let bracketType = "winners"

        completedMatches.forEach((match) => {
          const isPlayer1 = match.participant1_id === participant.id
          const playerScore = isPlayer1 ? match.participant1_score : match.participant2_score
          const opponentScore = isPlayer1 ? match.participant2_score : match.participant1_score

          pointsScored += playerScore
          pointsAgainst += opponentScore

          if (match.winner_id === participant.id) {
            matchesWon++
          } else if (match.winner_id) {
            matchesLost++
            if (match.elimination_match) {
              livesRemaining--
            }
          }
        })

        // Determinar bracket type basado en pérdidas
        if (livesRemaining <= 0) {
          bracketType = "eliminated"
        } else if (matchesLost > 0) {
          bracketType = "losers"
        } else {
          bracketType = "winners"
        }

        const winPercentage = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100 * 100) / 100 : 0
        const pointDifferential = pointsScored - pointsAgainst

        // Buscar estadística existente
        const existingStat = existingStats?.find((s) => s.participant_id === participant.id)

        return {
          id: existingStat?.id || 0,
          participant_id: participant.id,
          tournament_id: Number.parseInt(tournamentId),
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_lost: matchesLost,
          points_scored: pointsScored,
          points_against: pointsAgainst,
          win_percentage: winPercentage,
          point_differential: pointDifferential,
          bracket_type: bracketType,
          lives_remaining: livesRemaining,
          ranking: 0, // Se calculará después
          participant: participant,
        }
      }) || []

    // Ordenar por ranking y asignar posiciones
    const sortedStats = calculatedStats
      .sort((a, b) => {
        // Primero por victorias
        if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won
        // Luego por diferencia de puntos
        if (b.point_differential !== a.point_differential) return b.point_differential - a.point_differential
        // Finalmente por porcentaje de victoria
        return b.win_percentage - a.win_percentage
      })
      .map((stat, index) => ({
        ...stat,
        ranking: index + 1,
      }))

    // Separar por categoría para respuesta organizada
    const statsByCategory = {
      varonil: sortedStats.filter((s) => s.participant?.category === "varonil"),
      femenil: sortedStats.filter((s) => s.participant?.category === "femenil"),
      mixto: sortedStats.filter((s) => s.participant?.category === "mixto"),
    }

    // Calcular estadísticas del torneo
    const tournamentStats = {
      total_participants: participants?.length || 0,
      active_participants: participants?.filter((p) => p.status === "active").length || 0,
      eliminated_participants: sortedStats.filter((s) => s.bracket_type === "eliminated").length,
      winners_bracket: sortedStats.filter((s) => s.bracket_type === "winners").length,
      losers_bracket: sortedStats.filter((s) => s.bracket_type === "losers").length,
      total_matches_played: matches?.filter((m) => m.status === "finalizado" || m.status === "completed").length || 0,
      total_points_scored: sortedStats.reduce((sum, s) => sum + s.points_scored, 0),
      average_points_per_match:
        matches && matches.length > 0
          ? (
              sortedStats.reduce((sum, s) => sum + s.points_scored, 0) /
              matches.filter((m) => m.status === "finalizado" || m.status === "completed").length
            ).toFixed(1)
          : "0.0",
    }

    if (category) {
      return NextResponse.json({
        success: true,
        data: statsByCategory[category as keyof typeof statsByCategory] || [],
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...statsByCategory,
        tournament: tournamentStats,
      },
    })
  } catch (error) {
    console.error("Error in stats GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, participant_id, tournament_id = 1, stats } = await request.json()

    switch (action) {
      case "update": {
        if (!participant_id || !stats) {
          return NextResponse.json({ success: false, error: "participant_id y stats son requeridos" }, { status: 400 })
        }

        const { data, error } = await supabase
          .from("wildbrowl_stats")
          .upsert(
            {
              participant_id,
              tournament_id,
              ...stats,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "participant_id,tournament_id" },
          )
          .select()

        if (error) {
          console.error("Error updating stats:", error)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
      }

      case "reset": {
        const { error } = await supabase
          .from("wildbrowl_stats")
          .update({
            matches_played: 0,
            matches_won: 0,
            matches_lost: 0,
            points_scored: 0,
            points_against: 0,
            win_percentage: 0,
            point_differential: 0,
            lives_remaining: 2,
            bracket_type: "winners",
            ranking: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("tournament_id", tournament_id)

        if (error) {
          console.error("Error resetting stats:", error)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Estadísticas reiniciadas" })
      }

      case "delete": {
        if (!participant_id) {
          return NextResponse.json({ success: false, error: "participant_id es requerido" }, { status: 400 })
        }

        const { error } = await supabase
          .from("wildbrowl_stats")
          .delete()
          .eq("participant_id", participant_id)
          .eq("tournament_id", tournament_id)

        if (error) {
          console.error("Error deleting stats:", error)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Estadísticas eliminadas" })
      }

      case "generate_bracket": {
        const { category } = await request.json()
        if (!category) {
          return NextResponse.json({ success: false, error: "category es requerida" }, { status: 400 })
        }

        const { data, error } = await supabase.rpc("generate_wildbrowl_bracket", {
          tournament_id_param: tournament_id,
          category_param: category,
        })

        if (error) {
          console.error("Error generating bracket:", error)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: data })
      }

      default:
        return NextResponse.json({ success: false, error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in stats POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
