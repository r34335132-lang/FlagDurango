"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Users, Trophy, Star, Phone, Mail, MapPin, Calendar } from "lucide-react"

interface Team {
  id: number
  name: string
  category: string
  color1: string
  color2: string
  logo_url?: string
  captain_name?: string
  captain_phone?: string
  captain_photo_url?: string
  is_institutional: boolean
  coordinator_name?: string
  coordinator_phone?: string
  paid?: boolean
}

interface Player {
  id: number
  name: string
  jersey_number: number
  position: string
  photo_url?: string
  team_id: number
}

interface Game {
  id: number
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  game_date: string
  game_time: string
  venue: string
  field: string
  status: string
  mvp?: string
}

export default function TeamPage() {
  const params = useParams()
  const teamId = params.id as string
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar datos del equipo
        const teamResponse = await fetch(`/api/teams?id=${teamId}`)
        const teamData = await teamResponse.json()

        if (!teamData.success) {
          setError(teamData.message || "Error al cargar el equipo")
          return
        }

        setTeam(teamData.data)
        setPlayers(teamData.players || [])

        // Cargar partidos del equipo
        if (teamData.data?.name) {
          const gamesResponse = await fetch(`/api/games?team_names=${encodeURIComponent(teamData.data.name)}`)
          const gamesData = await gamesResponse.json()

          if (gamesData.success) {
            setGames(gamesData.data || [])
          }
        }
      } catch (err) {
        console.error("Error loading team data:", err)
        setError("Error al cargar los datos del equipo")
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      loadTeamData()
    }
  }, [teamId])

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      "varonil-gold": "Varonil Gold",
      "varonil-silver": "Varonil Silver",
      "femenil-gold": "Femenil Gold",
      "femenil-silver": "Femenil Silver",
      "femenil-cooper": "Femenil Cooper",
      "mixto-gold": "Mixto Gold",
      "mixto-silver": "Mixto Silver",
    }
    return labels[category] || category
  }

  const upcomingGames = games
    .filter((game) => game.status === "programado")
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
    .slice(0, 5)

  const recentGames = games
    .filter((game) => game.status === "finalizado")
    .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
              <p className="text-gray-600">{error || "Equipo no encontrado"}</p>
              <Button onClick={() => (window.location.href = "/equipos")} className="mt-4">
                Volver a Equipos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(to right, #0857b5, #e266be, #ff6d06)" }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Button
              onClick={() => (window.location.href = "/equipos")}
              className="mb-6 bg-white/20 hover:bg-white/30 text-white border-white/20"
              variant="outline"
            >
              ← Volver a Equipos
            </Button>

            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
              {team.logo_url ? (
                <img
                  src={team.logo_url || "/placeholder.svg"}
                  alt={`Logo de ${team.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) fallback.classList.remove("hidden")
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center text-white font-bold text-4xl ${team.logo_url ? "hidden" : ""}`}
                style={{
                  background: `linear-gradient(135deg, ${team.color1}, ${team.color2})`,
                }}
              >
                {team.name ? team.name.charAt(0) : "?"}
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{team.name}</h1>

            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <Badge className="bg-blue-600 text-white text-lg px-4 py-2">{getCategoryLabel(team.category)}</Badge>
              {team.is_institutional && (
                <Badge className="bg-purple-600 text-white text-lg px-4 py-2">Institucional</Badge>
              )}
              {team.paid ? (
                <Badge className="bg-green-600 text-white text-lg px-4 py-2">Inscripción Pagada</Badge>
              ) : (
                <Badge className="bg-red-600 text-white text-lg px-4 py-2">Pendiente de Pago</Badge>
              )}
            </div>

            <p className="text-xl text-white/90 mb-8">
              Información completa del equipo, jugadores y próximos partidos.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Header del equipo */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Logo del equipo */}
              <div className="relative">
                {team.logo_url ? (
                  <img
                    src={team.logo_url || "/placeholder.svg"}
                    alt={`Logo de ${team.name}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.classList.remove("hidden")
                    }}
                  />
                ) : null}
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-gray-200 ${team.logo_url ? "hidden" : ""}`}
                  style={{
                    background: `linear-gradient(135deg, ${team.color1}, ${team.color2})`,
                  }}
                >
                  {team.name ? team.name.charAt(0) : "?"}
                </div>
              </div>

              {/* Información del equipo */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <Badge className="bg-blue-600 text-white">{getCategoryLabel(team.category)}</Badge>
                  {team.is_institutional && <Badge className="bg-purple-600 text-white">Institucional</Badge>}
                  {team.paid ? (
                    <Badge className="bg-green-600 text-white">Inscripción Pagada</Badge>
                  ) : (
                    <Badge className="bg-red-600 text-white">Pendiente de Pago</Badge>
                  )}
                </div>

                {/* Información de contacto */}
                <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                  {team.captain_name && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Capitán: {team.captain_name}</span>
                    </div>
                  )}
                  {team.captain_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{team.captain_phone}</span>
                    </div>
                  )}
                  {team.is_institutional && team.coordinator_name && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Coordinador: {team.coordinator_name}</span>
                    </div>
                  )}
                  {team.is_institutional && team.coordinator_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{team.coordinator_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Jugadores */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Roster ({players.length} jugadores)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay jugadores registrados</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Foto del jugador */}
                      <div className="relative">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url || "/placeholder.svg"}
                            alt={`Foto de ${player.name}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) fallback.classList.remove("hidden")
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-gray-200 ${player.photo_url ? "hidden" : ""}`}
                          style={{
                            background: `linear-gradient(135deg, ${team.color1}, ${team.color2})`,
                          }}
                        >
                          #{player.jersey_number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 font-semibold">{player.name}</h4>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <span>#{player.jersey_number}</span>
                          {player.position && (
                            <>
                              <span>•</span>
                              <span>{player.position}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos partidos */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Próximos Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingGames.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay partidos programados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingGames.map((game) => (
                    <div key={game.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-900 font-semibold mb-2">
                        {game.home_team} vs {game.away_team}
                      </div>
                      <div className="text-gray-600 text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(game.game_date).toLocaleDateString("es-ES")}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {game.venue} - {game.field}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resultados recientes */}
        {recentGames.length > 0 && (
          <Card className="bg-white border-gray-200 mt-8">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Resultados Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {recentGames.map((game) => (
                  <div key={game.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-900 font-semibold mb-2">
                      {game.home_team} vs {game.away_team}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {game.home_score} - {game.away_score}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {new Date(game.game_date).toLocaleDateString("es-ES")}
                      {game.mvp && (
                        <div className="flex items-center gap-1 mt-1 text-yellow-600">
                          <Star className="w-4 h-4" />
                          MVP: {game.mvp}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
