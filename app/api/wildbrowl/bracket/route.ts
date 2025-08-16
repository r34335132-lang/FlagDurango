import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { category, tournament_name } = await request.json()

    if (!category) {
      return NextResponse.json({ success: false, error: "Categoría es requerida" }, { status: 400 })
    }

    // Crear nuevo torneo si se especifica nombre
    let tournamentId = 1
    if (tournament_name) {
      const { data: newTournament, error: tournamentError } = await supabase
        .from("wildbrowl_tournaments")
        .insert([
          {
            tournament_name,
            status: "activo",
            start_date: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (tournamentError) {
        console.error("Error creating tournament:", tournamentError)
        return NextResponse.json({ success: false, error: tournamentError.message }, { status: 500 })
      }

      tournamentId = newTournament.id
    }

    // Obtener participantes pagados de la categoría
    const { data: participants, error: participantsError } = await supabase
      .from("wildbrowl_participants")
      .select("id, player_name, category, image_url, alias")
      .eq("tournament_id", tournamentId)
      .eq("category", category)
      .eq("is_paid", true)
      .eq("status", "activo")
      .order("created_at", { ascending: true })

    if (participantsError) {
      console.error("Error fetching participants:", participantsError)
      return NextResponse.json({ success: false, error: participantsError.message }, { status: 500 })
    }

    if (!participants || participants.length < 2) {
      return NextResponse.json(
        { success: false, error: "Se necesitan al menos 2 participantes pagados para generar el bracket" },
        { status: 400 },
      )
    }

    // Determinar el formato del torneo basado en el número de participantes
    const participantCount = participants.length
    let tournamentFormat: string
    let initialRound: string
    let hasSecondChance = false

    if (participantCount <= 16) {
      // 16 o menos: Doble eliminación (segunda oportunidad)
      tournamentFormat = "double_elimination"
      hasSecondChance = true
      if (participantCount <= 4) {
        initialRound = "semifinal"
      } else if (participantCount <= 8) {
        initialRound = "cuartos"
      } else {
        initialRound = "16avos"
      }
    } else {
      // Más de 16: Eliminación simple hasta top 16, luego doble eliminación
      tournamentFormat = "single_elimination"
      hasSecondChance = false
      if (participantCount <= 32) {
        initialRound = "32avos"
      } else {
        initialRound = "32avos" // Máximo 32 participantes
      }
    }

    // Mezclar participantes aleatoriamente y asignar seeds
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)

    // Actualizar seeds en la base de datos
    for (let i = 0; i < shuffledParticipants.length; i++) {
      await supabase.from("wildbrowl_stats").upsert({
        tournament_id: tournamentId,
        participant_id: shuffledParticipants[i].id,
        seed_number: i + 1,
        bracket_position: i + 1,
        lives_remaining: hasSecondChance ? 2 : 1,
        bracket_type: "winners",
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        points_scored: 0,
        points_against: 0,
      })
    }

    // Generar partidos de la primera ronda
    const matches = []
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      if (i + 1 < shuffledParticipants.length) {
        matches.push({
          tournament_id: tournamentId,
          participant1_id: shuffledParticipants[i].id,
          participant2_id: shuffledParticipants[i + 1].id,
          round: initialRound,
          bracket_type: "winners",
          status: "programado",
          match_number: Math.floor(i / 2) + 1,
          participant1_score: 0,
          participant2_score: 0,
          elimination_match: !hasSecondChance,
        })
      }
    }

    // Manejar participante con bye si es número impar
    let byeParticipant = null
    if (shuffledParticipants.length % 2 !== 0) {
      byeParticipant = shuffledParticipants[shuffledParticipants.length - 1]
      // El participante con bye avanza automáticamente
      await supabase
        .from("wildbrowl_stats")
        .update({ current_round: getNextRound(initialRound) })
        .eq("tournament_id", tournamentId)
        .eq("participant_id", byeParticipant.id)
    }

    // Insertar partidos en la base de datos
    const { data: createdMatches, error: matchesError } = await supabase
      .from("wildbrowl_matches")
      .insert(matches)
      .select(`
        *,
        participant1:wildbrowl_participants!participant1_id(player_name, category, alias, image_url),
        participant2:wildbrowl_participants!participant2_id(player_name, category, alias, image_url)
      `)

    if (matchesError) {
      console.error("Error creating matches:", matchesError)
      return NextResponse.json({ success: false, error: matchesError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        tournament_id: tournamentId,
        matches: createdMatches,
        participants: shuffledParticipants.length,
        tournament_format: tournamentFormat,
        initial_round: initialRound,
        has_second_chance: hasSecondChance,
        bye_participant: byeParticipant,
      },
      message: `Bracket ${tournamentFormat} generado exitosamente para la categoría ${category}. ${matches.length} partidos creados.`,
    })
  } catch (error) {
    console.error("Error generating bracket:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// Función auxiliar para determinar la siguiente ronda
function getNextRound(currentRound: string): string {
  const roundProgression: { [key: string]: string } = {
    "32avos": "16avos",
    "16avos": "octavos",
    octavos: "cuartos",
    cuartos: "semifinal",
    semifinal: "final",
    final: "champion_of_champions",
  }
  return roundProgression[currentRound] || "final"
}

export async function GET() {
  try {
    // Obtener todos los partidos con información completa
    const { data: matches, error } = await supabase
      .from("wildbrowl_matches")
      .select(`
        *,
        participant1:wildbrowl_participants!participant1_id(
          id, player_name, category, alias, image_url
        ),
        participant2:wildbrowl_participants!participant2_id(
          id, player_name, category, alias, image_url
        ),
        winner:wildbrowl_participants!winner_id(
          id, player_name, alias, image_url
        )
      `)
      .eq("tournament_id", 1)
      .order("round", { ascending: true })
      .order("match_number", { ascending: true })

    if (error) {
      console.error("Error fetching bracket:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Organizar partidos por categoría y bracket
    const varonilMatches = matches?.filter((m) => m.participant1?.category === "varonil") || []
    const femenilMatches = matches?.filter((m) => m.participant1?.category === "femenil") || []

    const organizeBracket = (categoryMatches: any[]) => {
      const winners = categoryMatches.filter((m) => m.bracket_type === "winners")
      const losers = categoryMatches.filter((m) => m.bracket_type === "losers")

      const organizeByRound = (matches: any[]) => {
        const rounds: { [key: string]: any[] } = {}
        matches.forEach((match) => {
          if (!rounds[match.round]) rounds[match.round] = []
          rounds[match.round].push(match)
        })
        return rounds
      }

      return {
        winners: organizeByRound(winners),
        losers: organizeByRound(losers),
        total_matches: categoryMatches.length,
        completed_matches: categoryMatches.filter((m) => m.status === "finalizado").length,
      }
    }

    const bracket = {
      varonil: organizeBracket(varonilMatches),
      femenil: organizeBracket(femenilMatches),
      champion_match: matches?.find((m) => m.round === "champion_of_champions") || null,
    }

    return NextResponse.json({ success: true, data: bracket })
  } catch (error) {
    console.error("Error in bracket GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
