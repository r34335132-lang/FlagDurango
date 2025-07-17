"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

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
  referee1?: string
  referee2?: string
  mvp?: string
  home_team_logo?: string
  away_team_logo?: string
  home_team_color1?: string
  home_team_color2?: string
  away_team_color1?: string
  away_team_color2?: string
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { value: "femenil-silver", label: "Femenil Silver", color: "bg-pink-400" },
    { value: "femenil-gold", label: "Femenil Gold", color: "bg-pink-500" },
    { value: "varonil-silver", label: "Varonil Silver", color: "bg-blue-400" },
    { value: "varonil-gold", label: "Varonil Gold", color: "bg-blue-500" },
    { value: "mixto-silver", label: "Mixto Silver", color: "bg-orange-400" },
    { value: "mixto-gold", label: "Mixto Gold", color: "bg-orange-500" },
  ]

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/games")
        const data = await response.json()
        if (data.success) {
          setGames(data.data)
        } else {
          setError(data.message || "Error al cargar partidos.")
        }
      } catch (err) {
        console.error("Error fetching games:", err)
        setError("Error de red o del servidor al cargar partidos.")
      } finally {
        setLoading(false)
      }
    }
    fetchGames()

    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [])

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.value === category)
    return cat?.color || "bg-gray-500"
  }

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category)
    return cat?.label || category
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <p className="text-white text-xl">Cargando partidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <p className="text-red-400 text-xl">{error}</p>
      </div>
    )
  }

  const upcomingGames = games
    .filter((game) => game.status === "programado")
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())

  const finishedGames = games
    .filter((game) => game.status === "finalizado")
    .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())

  const liveGames = games.filter((game) => game.status === "en_vivo")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white">Liga Flag Durango</h1>
              <p className="text-white/70">Temporada 2025</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="/" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Inicio
              </a>
              <a href="/partidos" className="text-yellow-400 font-medium">
                Partidos
              </a>
              <a href="/equipos" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Equipos
              </a>
              <a href="/estadisticas" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Estadísticas
              </a>
              <a href="/noticias" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Noticias
              </a>
              <a href="/login" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Cuenta
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="pt-8 pb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-center">Calendario de Partidos</h1>
          <p className="text-white/80 text-center text-lg">
            Todos los partidos programados, en vivo y finalizados de la liga.
          </p>
        </div>
      </div>

      <div className="container mx-auto p-4 lg:p-6">
        {liveGames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 text-white text-center">🔴 Partidos en Vivo</h2>
            <div className="grid grid-cols-1 gap-6">
              {liveGames.map((game) => (
                <Card key={game.id} className="border-2 border-red-500 shadow-lg bg-red-500/10 backdrop-blur-sm">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 flex-grow">
                        <div className="text-center">
                          <p className="text-sm text-white/70">
                            {new Date(game.game_date).toLocaleDateString("es-ES")}
                          </p>
                          <p className="font-semibold text-white">{game.game_time}</p>
                        </div>
                        <div className="flex items-center space-x-4 w-full sm:w-auto">
                          <div className="text-right">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-1"
                              style={{
                                background: `linear-gradient(to right, ${game.home_team_color1 || "#3B82F6"}, ${game.home_team_color2 || "#1E40AF"})`,
                              }}
                            >
                              {game.home_team.charAt(0)}
                            </div>
                            <p className="font-semibold text-white">{game.home_team}</p>
                            <p className="text-sm text-white/70">Local</p>
                          </div>
                          <div className="text-center px-4">
                            <div className="text-3xl font-bold text-red-400 animate-pulse">
                              {game.home_score || 0} - {game.away_score || 0}
                            </div>
                          </div>
                          <div>
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-1"
                              style={{
                                background: `linear-gradient(to right, ${game.away_team_color1 || "#10B981"}, ${game.away_team_color2 || "#059669"})`,
                              }}
                            >
                              {game.away_team.charAt(0)}
                            </div>
                            <p className="font-semibold text-white">{game.away_team}</p>
                            <p className="text-sm text-white/70">Visitante</p>
                          </div>
                        </div>
                        <div className="text-sm text-white/70">
                          <p className="font-medium">{game.venue}</p>
                          <p className="text-white/60">{game.field}</p>
                          {(game.referee1 || game.referee2) && (
                            <p className="text-white/60">
                              Árbitros: {[game.referee1, game.referee2].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Badge className={`${getCategoryColor(game.category)} text-white`}>
                          {getCategoryLabel(game.category)}
                        </Badge>
                        <Badge className="bg-red-500 text-white animate-pulse">EN VIVO</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 text-white text-center">Próximos Partidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {upcomingGames.length > 0 ? (
            upcomingGames.map((game) => (
              <Card
                key={game.id}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/10 backdrop-blur-sm border-white/20"
              >
                <CardHeader className="p-0">
                  <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <div className="absolute inset-0 flex items-center justify-center gap-4 p-4">
                      <div className="flex flex-col items-center text-center w-1/2">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2"
                          style={{
                            background: `linear-gradient(to right, ${game.home_team_color1 || "#3B82F6"}, ${game.home_team_color2 || "#1E40AF"})`,
                          }}
                        >
                          {game.home_team.charAt(0)}
                        </div>
                        <span className="font-semibold text-lg text-white truncate">{game.home_team}</span>
                        <span className="text-sm text-white/70">Local</span>
                      </div>
                      <div className="text-2xl font-bold text-white">VS</div>
                      <div className="flex flex-col items-center text-center w-1/2">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2"
                          style={{
                            background: `linear-gradient(to right, ${game.away_team_color1 || "#10B981"}, ${game.away_team_color2 || "#059669"})`,
                          }}
                        >
                          {game.away_team.charAt(0)}
                        </div>
                        <span className="font-semibold text-lg text-white truncate">{game.away_team}</span>
                        <span className="text-sm text-white/70">Visitante</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className={`${getCategoryColor(game.category)} text-white`}>
                      {getCategoryLabel(game.category)}
                    </Badge>
                    <Badge variant="secondary">Programado</Badge>
                  </div>
                  <div className="text-center text-white/80 space-y-1">
                    <p className="flex items-center justify-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-white/60" />
                      {new Date(game.game_date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="flex items-center justify-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-white/60" />
                      {game.game_time}
                    </p>
                    <p className="flex items-center justify-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-white/60" />
                      {game.venue} - {game.field}
                    </p>
                    {(game.referee1 || game.referee2) && (
                      <p className="flex items-center justify-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-white/60" />
                        Árbitros: {[game.referee1, game.referee2].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-white/70 text-lg mt-8 col-span-full">
              No hay partidos programados actualmente.
            </p>
          )}
        </div>

        <h2 className="text-3xl font-bold mb-6 text-white text-center">Partidos Finalizados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finishedGames.length > 0 ? (
            finishedGames.map((game) => (
              <Card
                key={game.id}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/10 backdrop-blur-sm border-white/20"
              >
                <CardHeader className="p-0">
                  <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-blue-500/20">
                    <div className="absolute inset-0 flex items-center justify-center gap-4 p-4">
                      <div className="flex flex-col items-center text-center w-1/2">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2"
                          style={{
                            background: `linear-gradient(to right, ${game.home_team_color1 || "#3B82F6"}, ${game.home_team_color2 || "#1E40AF"})`,
                          }}
                        >
                          {game.home_team.charAt(0)}
                        </div>
                        <span className="font-semibold text-lg text-white truncate">{game.home_team}</span>
                        <span className="text-sm text-white/70">Local</span>
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {game.home_score} - {game.away_score}
                      </div>
                      <div className="flex flex-col items-center text-center w-1/2">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2"
                          style={{
                            background: `linear-gradient(to right, ${game.away_team_color1 || "#10B981"}, ${game.away_team_color2 || "#059669"})`,
                          }}
                        >
                          {game.away_team.charAt(0)}
                        </div>
                        <span className="font-semibold text-lg text-white truncate">{game.away_team}</span>
                        <span className="text-sm text-white/70">Visitante</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className={`${getCategoryColor(game.category)} text-white`}>
                      {getCategoryLabel(game.category)}
                    </Badge>
                    <Badge className="bg-green-600">Finalizado</Badge>
                  </div>
                  <div className="text-center text-white/80 space-y-1">
                    <p className="flex items-center justify-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-white/60" />
                      {new Date(game.game_date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="flex items-center justify-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-white/60" />
                      {game.game_time}
                    </p>
                    <p className="flex items-center justify-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-white/60" />
                      {game.venue} - {game.field}
                    </p>
                    {game.mvp && (
                      <p className="flex items-center justify-center text-sm text-yellow-400">
                        <Users className="w-4 h-4 mr-2" />
                        MVP: {game.mvp}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-white/70 text-lg mt-8 col-span-full">
              No hay partidos finalizados para mostrar.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
