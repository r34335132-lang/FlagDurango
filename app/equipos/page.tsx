"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Trophy, Phone, Mail, ExternalLink, ArrowRight, Clock, Search, Filter } from "lucide-react"

interface Team {
  id: number
  name: string
  category: string
  logo_url?: string
  color1: string
  color2: string
  is_institutional?: boolean
  coordinator_name?: string
  coordinator_phone?: string
  captain_photo_url?: string
  captain_name?: string
  captain_phone?: string
  coach_name?: string
  coach_phone?: string
  stats?: {
    games_played: number
    wins: number
    losses: number
    draws: number
    points: number
    points_for: number
    points_against: number
  }
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
  category: string
  status: string
  mvp?: string
  match_type?: string
  jornada?: number
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setCategoryFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [teamsResponse, gamesResponse] = await Promise.all([fetch("/api/teams"), fetch("/api/games")])

      const [teamsData, gamesData] = await Promise.all([teamsResponse.json(), gamesResponse.json()])

      if (teamsData.success) {
        setTeams(teamsData.data || [])
      } else {
        setError(teamsData.message || "Error al cargar equipos")
      }

      if (gamesData.success) {
        setGames(gamesData.data || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Error de conexión al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      "varonil-libre": "Varonil Libre",
      "femenil-gold": "Femenil Gold",
      "femenil-silver": "Femenil Silver",
      "femenil-cooper": "Femenil Cooper",
      "mixto-gold": "Mixto Gold",
      "mixto-silver": "Mixto Silver",
      teens: "Teens",
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "varonil-libre": "bg-blue-500",
      "femenil-gold": "bg-pink-500",
      "femenil-silver": "bg-pink-400",
      "femenil-cooper": "bg-pink-600",
      "mixto-gold": "bg-orange-500",
      "mixto-silver": "bg-orange-400",
      teens: "bg-green-500",
    }
    return colors[category] || "bg-gray-500"
  }

  const getTeamRecentGames = (teamName: string) => {
    return games
      .filter((game) => (game.home_team === teamName || game.away_team === teamName) && game.status === "finalizado")
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
      .slice(0, 3)
  }

  // Filtrar equipos
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || team.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(teams.map((team) => team.category)))

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-xl">Cargando equipos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(to right, #0857b5, #e266be, #ff6d06)" }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-green-400/95 backdrop-blur-sm text-gray-900 px-6 py-2 rounded-full font-bold mb-6">
              {"🏈 Equipos - Liga Flag Durango"}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Equipos
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                2025
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Conoce a todos los equipos participantes en la temporada actual.
              <span className="block mt-2 text-yellow-300 font-semibold">¡{teams.length} equipos registrados!</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
                onClick={() => (window.location.href = "/partidos")}
              >
                <Trophy className="w-5 h-5 mr-2" />
                Ver Partidos
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold"
                onClick={() => (window.location.href = "/estadisticas")}
              >
                <Users className="w-5 h-5 mr-2" />
                Estadísticas
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
                onClick={() => (window.location.href = "/")}
              >
                Inicio
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar equipos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-gray-600">
            {filteredTeams.length} de {teams.length} equipos
          </div>
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            onClick={() => setCategoryFilter("all")}
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={
              selectedCategory === "all" ? "bg-blue-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }
          >
            Todas ({teams.length})
          </Button>
          {categories.map((category) => {
            const count = teams.filter((t) => t.category === category).length
            return (
              <Button
                key={category}
                onClick={() => setCategoryFilter(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }
              >
                {getCategoryLabel(category)} ({count})
              </Button>
            )
          })}
        </div>

        {/* Grid de equipos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map((team) => {
            const teamRecentGames = getTeamRecentGames(team.name)

            return (
              <Card
                key={team.id}
                className="bg-white border-gray-200 hover:shadow-lg transition-all transform hover:scale-105"
              >
                <CardHeader className="text-center pb-4">
                  {/* Logo del equipo */}
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-200">
                    {team.logo_url ? (
                      <img
                        src={team.logo_url || "/placeholder.svg"}
                        alt={`Logo de ${team.name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback a iniciales si la imagen falla
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-white font-bold text-2xl" 
                                   style="background: linear-gradient(to right, ${team.color1}, ${team.color2})">
                                ${team.name.split(" ")[0].charAt(0)}
                              </div>
                            `
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
                        style={{
                          background: `linear-gradient(to right, ${team.color1}, ${team.color2})`,
                        }}
                      >
                        {team.name.split(" ")[0].charAt(0)}
                      </div>
                    )}
                  </div>

                  <CardTitle className="text-gray-900 text-lg mb-2">{team.name}</CardTitle>
                  <Badge className={`mx-auto text-white ${getCategoryColor(team.category)}`}>
                    {getCategoryLabel(team.category)}
                  </Badge>

                  {team.is_institutional && (
                    <Badge variant="secondary" className="mx-auto mt-2">
                      Institucional
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Estadísticas */}
                  {team.stats && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-gray-900 font-semibold mb-2 flex items-center">
                        <Trophy className="w-4 h-4 mr-2" />
                        Estadísticas
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Partidos: {team.stats.games_played}</div>
                        <div>Puntos: {team.stats.points}</div>
                        <div>Ganados: {team.stats.wins}</div>
                        <div>Perdidos: {team.stats.losses}</div>
                        <div>Empates: {team.stats.draws}</div>
                        <div>PF: {team.stats.points_for}</div>
                      </div>
                    </div>
                  )}

                  {/* Últimos Resultados */}
                  {teamRecentGames.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-gray-900 font-semibold mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Últimos Resultados
                      </h4>
                      <div className="space-y-2">
                        {teamRecentGames.map((game) => {
                          const isHome = game.home_team === team.name
                          const opponent = isHome ? game.away_team : game.home_team
                          const teamScore = isHome ? game.home_score : game.away_score
                          const opponentScore = isHome ? game.away_score : game.home_score
                          const won = teamScore! > opponentScore!

                          return (
                            <div key={game.id} className="text-xs text-gray-600 flex justify-between items-center">
                              <span className="truncate flex-1">vs {opponent}</span>
                              <span className={`font-bold ${won ? "text-green-600" : "text-red-600"}`}>
                                {teamScore}-{opponentScore}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Información de contacto */}
                  {(team.coordinator_name || team.coordinator_phone || team.captain_name || team.coach_name) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-gray-900 font-semibold mb-2 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Contactos
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {team.coordinator_name && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-2" />
                            Coord: {team.coordinator_name}
                          </div>
                        )}
                        {team.captain_name && (
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-2" />
                            Cap: {team.captain_name}
                          </div>
                        )}
                        {team.coach_name && (
                          <div className="flex items-center">
                            <Trophy className="w-3 h-3 mr-2" />
                            Coach: {team.coach_name}
                          </div>
                        )}
                        {team.coordinator_phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-2" />
                            {team.coordinator_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Foto del capitán */}
                  {team.captain_photo_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-gray-900 font-semibold mb-2">Capitán</h4>
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={team.captain_photo_url || "/placeholder.svg"}
                          alt="Foto del capitán"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botón para ver más detalles */}
                  <Button
                    onClick={() => (window.location.href = `/equipos/${team.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay equipos</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== "all"
                ? "Intenta ajustar tus filtros de búsqueda"
                : "Aún no hay equipos registrados en la liga."}
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <section className="py-16" style={{ background: "linear-gradient(to right, #0857b5, #e266be, #ff6d06)" }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Quieres unirte?</h2>
          <p className="text-white/90 text-lg mb-8">Registra tu equipo y forma parte de la Liga Flag Durango</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold"
              onClick={() => (window.location.href = "/register-team")}
            >
              <Users className="w-5 h-5 mr-2" />
              Registrar Equipo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
              onClick={() => (window.location.href = "/register-coach")}
            >
              Registrar Coach
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
