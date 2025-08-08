"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Trophy } from 'lucide-react'

interface Game {
  id: number
  home_team: string
  away_team: string
  home_score?: number | null
  away_score?: number | null
  game_date: string
  game_time: string
  venue: string
  field: string
  category: string
  status: string
  referee1?: string | null
  referee2?: string | null
  mvp?: string | null
  stage?: string | null
}

interface Team {
  id: number
  name: string
  category: string
  color1: string
  color2: string
  logo_url?: string | null
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [gamesRes, teamsRes] = await Promise.all([fetch("/api/games"), fetch("/api/teams")])
        const [gamesData, teamsData] = await Promise.all([gamesRes.json(), teamsRes.json()])
        if (gamesData.success) setGames(gamesData.data)
        else setError(gamesData.message || "Error al cargar partidos.")

        if (teamsData.success) setTeams(teamsData.data)
      } catch (e) {
        setError("Error de red o del servidor al cargar partidos.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    const i = setInterval(fetchAll, 30000)
    return () => clearInterval(i)
  }, [])

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>()
    teams.forEach((t) => map.set(t.name, t))
    return map
  }, [teams])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "femenil-silver": "bg-pink-400",
      "femenil-gold": "bg-pink-500",
      "varonil-silver": "bg-blue-400",
      "varonil-gold": "bg-blue-500",
      "mixto-silver": "bg-orange-400",
      "mixto-gold": "bg-orange-500",
    }
    return colors[category] || "bg-gray-500"
  }

  const getStageLabel = (stage?: string | null) => {
    switch (stage) {
      case "quarterfinal":
        return "Cuartos"
      case "semifinal":
        return "Semifinal"
      case "final":
        return "Final"
      case "third_place":
        return "Tercer Lugar"
      default:
        return "Temporada"
    }
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

  const normalizedStatus = (s: string) => (s === "en vivo" || s === "en_vivo" ? "en_vivo" : s)

  const liveGames = games.filter((g) => normalizedStatus(g.status) === "en_vivo")
  const upcomingGames = games
    .filter((g) => normalizedStatus(g.status) === "programado")
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
  const finishedGames = games
    .filter((g) => normalizedStatus(g.status) === "finalizado")
    .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())

  const renderTeam = (name: string) => {
    const t = teamMap.get(name)
    return (
      <div className="flex flex-col items-center text-center w-1/2">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2 overflow-hidden"
          style={{ background: `linear-gradient(to right, ${t?.color1 || "#3B82F6"}, ${t?.color2 || "#1E40AF"})` }}
        >
          {t?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logo_url || "/placeholder.svg?height=64&width=64&query=logo%20equipo"} alt={name} className="h-full w-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <span className="font-semibold text-lg text-white truncate">{name}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Simple nav */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-white font-bold">Liga Flag Durango</a>
            <div className="flex gap-4 text-sm">
              <a href="/partidos" className="text-yellow-400 font-medium">Partidos</a>
              <a href="/equipos" className="text-white/80 hover:text-white">Equipos</a>
              <a href="/estadisticas" className="text-white/80 hover:text-white">Estadísticas</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="pt-8 pb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-center">Calendario de Partidos</h1>
          <p className="text-white/80 text-center text-lg">Programados, en vivo y finalizados</p>
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
                      <div className="flex items-center gap-6 flex-1">
                        <div className="text-center">
                          <p className="text-sm text-white/70">{new Date(game.game_date).toLocaleDateString("es-ES")}</p>
                          <p className="font-semibold text-white">{game.game_time}</p>
                        </div>
                        <div className="flex items-center gap-6 w-full">
                          {renderTeam(game.home_team)}
                          <div className="text-3xl font-bold text-red-400 animate-pulse">{(game.home_score ?? 0)} - {(game.away_score ?? 0)}</div>
                          {renderTeam(game.away_team)}
                        </div>
                        <div className="text-sm text-white/70">
                          <p className="font-medium">{game.venue}</p>
                          <p className="text-white/60">{game.field}</p>
                          {(game.referee1 || game.referee2) && (
                            <p className="text-white/60">Árbitros: {[game.referee1, game.referee2].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Badge className={`${getCategoryColor(game.category)} text-white`}>{game.category}</Badge>
                        <Badge className="bg-red-500 text-white animate-pulse">EN VIVO</Badge>
                        {game.stage && game.stage !== "regular" && <Badge variant="secondary">{getStageLabel(game.stage)}</Badge>}
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
              <Card key={game.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="p-0">
                  <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <div className="absolute inset-0 flex items-center justify-center gap-6 p-4">
                      {renderTeam(game.home_team)}
                      <div className="text-2xl font-bold text-white">VS</div>
                      {renderTeam(game.away_team)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className={`${getCategoryColor(game.category)} text-white`}>{game.category}</Badge>
                    <Badge variant="secondary">Programado</Badge>
                    {game.stage && game.stage !== "regular" && <Badge variant="outline">{getStageLabel(game.stage)}</Badge>}
                  </div>
                  <div className="text-center text-white/80 space-y-1">
                    <p className="flex items-center justify-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-white/60" />
                      {new Date(game.game_date).toLocaleDateString("es-ES", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
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
            <p className="text-center text-white/70 text-lg mt-8 col-span-full">No hay partidos programados actualmente.</p>
          )}
        </div>

        <h2 className="text-3xl font-bold mb-6 text-white text-center">Partidos Finalizados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finishedGames.length > 0 ? (
            finishedGames.map((game) => (
              <Card key={game.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="p-0">
                  <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-blue-500/20">
                    <div className="absolute inset-0 flex items-center justify-center gap-6 p-4">
                      {renderTeam(game.home_team)}
                      <div className="text-3xl font-bold text-white">{(game.home_score ?? 0)} - {(game.away_score ?? 0)}</div>
                      {renderTeam(game.away_team)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className={`${getCategoryColor(game.category)} text-white`}>{game.category}</Badge>
                    <Badge className="bg-green-600">Finalizado</Badge>
                    {game.stage && game.stage !== "regular" && <Badge variant="outline">{getStageLabel(game.stage)}</Badge>}
                  </div>
                  <div className="text-center text-white/80 space-y-1">
                    <p className="flex items-center justify-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-white/60" />
                      {new Date(game.game_date).toLocaleDateString("es-ES", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                    <p className="flex items-center justify-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-white/60" />
                      {game.venue} - {game.field}
                    </p>
                    {game.mvp && (
                      <p className="flex items-center justify-center text-sm text-yellow-300">
                        <Trophy className="w-4 h-4 mr-2" /> MVP: {game.mvp}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-white/70 text-lg mt-8 col-span-full">No hay partidos finalizados para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  )
}
