import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const season = searchParams.get("season") || "2025"

    // Primero obtener todos los equipos
    let teamsQuery = supabase
      .from("teams")
      .select("id, name, category, logo_url, color1, color2")
      .eq("status", "active")

    if (category && category !== "all") {
      teamsQuery = teamsQuery.eq("category", category)
    }

    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ success: false, error: teamsError.message }, { status: 500 })
    }

    // Obtener estadísticas existentes
    let statsQuery = supabase.from("team_stats").select("*").eq("season", season)

    if (category && category !== "all") {
      statsQuery = statsQuery.eq("team_category", category)
    }

    const { data: existingStats, error: statsError } = await statsQuery

    if (statsError) {
      console.error("Error fetching stats:", statsError)
      return NextResponse.json({ success: false, error: statsError.message }, { status: 500 })
    }

    // Crear estadísticas para equipos que no las tienen
    const statsWithTeams =
      teams?.map((team) => {
        const teamStats = existingStats?.find((stat) => stat.team_name === team.name)

        return {
          team_id: team.id,
          team_name: team.name,
          team_category: team.category,
          team_logo: team.logo_url,
          team_color1: team.color1,
          team_color2: team.color2,
          season: season,
          games_played: teamStats?.games_played || 0,
          games_won: teamStats?.games_won || 0,
          games_lost: teamStats?.games_lost || 0,
          games_tied: teamStats?.games_tied || 0,
          points: teamStats?.points || 0,
          points_for: teamStats?.points_for || 0,
          points_against: teamStats?.points_against || 0,
          point_difference: (teamStats?.points_for || 0) - (teamStats?.points_against || 0),
          win_percentage:
            teamStats?.games_played > 0 ? ((teamStats.games_won / teamStats.games_played) * 100).toFixed(1) : "0.0",
        }
      }) || []

    // Ordenar por puntos, luego por diferencia de puntos
    const sortedStats = statsWithTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.point_difference - a.point_difference
    })

    // Agregar posición
    const statsWithPosition = sortedStats.map((stat, index) => ({
      ...stat,
      position: index + 1,
    }))

    return NextResponse.json({ success: true, data: statsWithPosition })
  } catch (error) {
    console.error("Error in stats GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
