import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST() {
  try {
    // Obtener todos los equipos
    const { data: teams, error: teamsError } = await supabaseAdmin.from("teams").select("id, name, category")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ success: false, error: teamsError.message }, { status: 500 })
    }

    let updatedTeams = 0

    for (const team of teams) {
      // Obtener estadísticas del equipo
      const { data: homeGames } = await supabaseAdmin
        .from("games")
        .select("*")
        .eq("home_team", team.name)
        .eq("status", "finalizado")

      const { data: awayGames } = await supabaseAdmin
        .from("games")
        .select("*")
        .eq("away_team", team.name)
        .eq("status", "finalizado")

      const allGames = [...(homeGames || []), ...(awayGames || [])]

      let wins = 0
      let losses = 0
      let draws = 0
      let pointsFor = 0
      let pointsAgainst = 0

      allGames.forEach((game) => {
        const isHome = game.home_team === team.name
        const teamScore = isHome ? game.home_score : game.away_score
        const opponentScore = isHome ? game.away_score : game.home_score

        pointsFor += teamScore || 0
        pointsAgainst += opponentScore || 0

        if (teamScore > opponentScore) {
          wins++
        } else if (teamScore < opponentScore) {
          losses++
        } else {
          draws++
        }
      })

      const points = wins * 3 + draws * 1

      // Verificar si ya existe una estadística para este equipo
      const { data: existingStats } = await supabaseAdmin
        .from("team_stats")
        .select("id")
        .eq("team_id", team.id)
        .eq("season", 2025)
        .single()

      if (existingStats) {
        // Actualizar estadísticas existentes
        await supabaseAdmin
          .from("team_stats")
          .update({
            games_played: allGames.length,
            games_won: wins,
            games_lost: losses,
            games_tied: draws,
            points_for: pointsFor,
            points_against: pointsAgainst,
            points: points,
            point_difference: pointsFor - pointsAgainst,
            win_percentage: allGames.length > 0 ? ((wins / allGames.length) * 100).toFixed(1) : "0.0",
          })
          .eq("id", existingStats.id)
      } else {
        // Crear nuevas estadísticas
        await supabaseAdmin.from("team_stats").insert({
          team_id: team.id,
          team_name: team.name,
          team_category: team.category,
          season: 2025,
          games_played: allGames.length,
          games_won: wins,
          games_lost: losses,
          games_tied: draws,
          points_for: pointsFor,
          points_against: pointsAgainst,
          points: points,
          point_difference: pointsFor - pointsAgainst,
          win_percentage: allGames.length > 0 ? ((wins / allGames.length) * 100).toFixed(1) : "0.0",
          position: 1, // Se calculará después
        })
      }

      updatedTeams++
    }

    // Actualizar posiciones por categoría
    const categories = [
      "varonil-gold",
      "varonil-silver",
      "femenil-gold",
      "femenil-silver",
      "mixto-gold",
      "mixto-silver",
    ]

    for (const category of categories) {
      const { data: categoryStats } = await supabaseAdmin
        .from("team_stats")
        .select("*")
        .eq("team_category", category)
        .eq("season", 2025)
        .order("points", { ascending: false })
        .order("point_difference", { ascending: false })

      if (categoryStats) {
        for (let i = 0; i < categoryStats.length; i++) {
          await supabaseAdmin
            .from("team_stats")
            .update({ position: i + 1 })
            .eq("id", categoryStats[i].id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Estadísticas actualizadas correctamente",
      updated_teams: updatedTeams,
    })
  } catch (error) {
    console.error("Error updating stats:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
