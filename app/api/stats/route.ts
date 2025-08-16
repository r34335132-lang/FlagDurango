import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

function normalizeCategory(value: unknown): string {
  if (value === undefined || value === null) return ""
  return String(value)
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const season = searchParams.get("season") || "2025"

    // Construir la consulta base
    let teamsQuery = supabase.from("teams").select("*")

    // Filtrar por categoría si se especifica y no es "all"
    if (category && category !== "all") {
      const normalizedCategory = normalizeCategory(category)
      teamsQuery = teamsQuery.eq("category", normalizedCategory)
    }

    const { data: teams, error: teamsError } = await teamsQuery.order("name", { ascending: true })

    if (teamsError) {
      return NextResponse.json({ success: false, message: teamsError.message }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Obtener todos los juegos
    const { data: games, error: gamesError } = await supabase.from("games").select("*").eq("status", "finalizado")

    if (gamesError) {
      return NextResponse.json({ success: false, message: gamesError.message }, { status: 500 })
    }

    // Calcular estadísticas para cada equipo
    const stats = teams.map((team) => {
      const teamGames = (games || []).filter(
        (game) =>
          (game.home_team === team.name || game.away_team === team.name) &&
          (!category || category === "all" || normalizeCategory(game.category) === normalizeCategory(category)),
      )

      let wins = 0
      let losses = 0
      let ties = 0
      let pointsFor = 0
      let pointsAgainst = 0

      teamGames.forEach((game) => {
        const isHome = game.home_team === team.name
        const teamScore = isHome ? game.home_score || 0 : game.away_score || 0
        const opponentScore = isHome ? game.away_score || 0 : game.home_score || 0

        pointsFor += teamScore
        pointsAgainst += opponentScore

        if (teamScore > opponentScore) {
          wins++
        } else if (teamScore < opponentScore) {
          losses++
        } else {
          ties++
        }
      })

      const gamesPlayed = teamGames.length
      const points = wins * 3 + ties * 1 // 3 puntos por victoria, 1 por empate
      const pointDifference = pointsFor - pointsAgainst
      const winPercentage = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : "0.0"

      return {
        team_id: team.id,
        team_name: team.name,
        team_category: team.category,
        team_logo: team.logo_url,
        team_color1: team.color1,
        team_color2: team.color2,
        position: 0, // Se calculará después del ordenamiento
        games_played: gamesPlayed,
        games_won: wins,
        games_lost: losses,
        games_tied: ties,
        points: points,
        points_for: pointsFor,
        points_against: pointsAgainst,
        point_difference: pointDifference,
        win_percentage: winPercentage,
      }
    })

    // Ordenar por puntos (descendente), luego por diferencia de puntos (descendente)
    stats.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points
      }
      return b.point_difference - a.point_difference
    })

    // Asignar posiciones
    stats.forEach((team, index) => {
      team.position = index + 1
    })

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Error in stats API:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
