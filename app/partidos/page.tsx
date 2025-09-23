"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  ArrowRight,
  Castle as Whistle,
  Search,
  Filter,
  Instagram,
  MessageCircle,
  Copy,
} from "lucide-react"

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
  match_type?: string
  jornada?: number
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
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [matchTypeFilter, setMatchTypeFilter] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [gamesRes, teamsRes] = await Promise.all([fetch("/api/games"), fetch("/api/teams")])
        const [gamesData, teamsData] = await Promise.all([gamesRes.json(), teamsRes.json()])

        if (gamesData.success) {
          setGames(gamesData.data || [])
        } else {
          setError(gamesData.message || "Error al cargar partidos.")
        }

        if (teamsData.success) {
          setTeams(teamsData.data || [])
        }
      } catch (e) {
        console.error("Error fetching data:", e)
        setError("Error de red o del servidor al cargar partidos.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
    const i = setInterval(loadData, 30000)
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
      "femenil-cooper": "bg-pink-600",
      "varonil-silver": "bg-blue-400",
      "varonil-gold": "bg-blue-500",
      "mixto-silver": "bg-orange-400",
      "mixto-gold": "bg-orange-500",
    }
    return colors[category] || "bg-gray-500"
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      "femenil-silver": "Femenil Silver",
      "femenil-gold": "Femenil Gold",
      "femenil-cooper": "Femenil Cooper",
      "varonil-silver": "Varonil Silver",
      "varonil-gold": "Varonil Gold",
      "mixto-silver": "Mixto Silver",
      "mixto-gold": "Mixto Gold",
    }
    return labels[category] || category
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

  const getReferees = (game: Game) => {
    const refs = [game.referee1, game.referee2].filter(Boolean)
    return refs.length > 0 ? refs.join(", ") : "Sin asignar"
  }

  const getTeamLogo = (teamName: string) => {
    const team = teams.find((t) => t.name === teamName)
    return team?.logo_url || null
  }

  const getTeamColors = (teamName: string) => {
    const team = teams.find((t) => t.name === teamName)
    return {
      color1: team?.color1 || "#3B82F6",
      color2: team?.color2 || "#1E40AF",
    }
  }

  const shareGame = async (game: Game, platform?: "instagram" | "whatsapp" | "copy") => {
    const gameDate = new Date(game.game_date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const shareText = `🏈 ${game.home_team} vs ${game.away_team}
📅 ${gameDate} a las ${game.game_time}
📍 ${game.venue} - ${game.field}
🏆 ${getCategoryLabel(game.category)}

¡No te lo pierdas! Liga Flag Durango
${window.location.href}`

    const shareData = {
      title: `${game.home_team} vs ${game.away_team}`,
      text: shareText,
      url: window.location.href,
    }

    try {
      if (platform === "whatsapp") {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
        window.open(whatsappUrl, "_blank")
      } else if (platform === "instagram") {
        // Para Instagram, copiamos al portapapeles y abrimos Instagram
        await navigator.clipboard.writeText(shareText)
        // Intentar abrir Instagram (funciona en móviles)
        const instagramUrl = "instagram://story-camera"
        const fallbackUrl = "https://www.instagram.com/"

        try {
          window.location.href = instagramUrl
        } catch {
          window.open(fallbackUrl, "_blank")
        }

        // Mostrar mensaje de que se copió
        showCopyFeedback("¡Copiado! Pégalo en Instagram")
      } else if (platform === "copy") {
        await navigator.clipboard.writeText(shareText)
        showCopyFeedback("¡Copiado al portapapeles!")
      } else {
        // Compartir nativo del navegador
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData)
        } else {
          await navigator.clipboard.writeText(shareText)
          showCopyFeedback("¡Copiado al portapapeles!")
        }
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(shareText)
        showCopyFeedback("¡Copiado al portapapeles!")
      } catch (clipboardError) {
        console.error("Error copying to clipboard:", clipboardError)
      }
    }
  }

  const showCopyFeedback = (message: string) => {
    const button = document.activeElement as HTMLButtonElement
    if (button) {
      const originalText = button.innerHTML
      button.innerHTML = `✅ ${message}`
      button.disabled = true
      setTimeout(() => {
        button.innerHTML = originalText
        button.disabled = false
      }, 3000)
    }
  }

  const filteredGames = (gamesList: Game[]) => {
    return gamesList.filter((game) => {
      const matchesSearch =
        !searchTerm ||
        game.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.venue.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !categoryFilter || game.category === categoryFilter
      const matchesStatus = !statusFilter || normalizedStatus(game.status) === statusFilter
      const matchesMatchType = !matchTypeFilter || game.match_type === matchTypeFilter

      return matchesSearch && matchesCategory && matchesStatus && matchesMatchType
    })
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to right, #0857b5, #e266be, #ff6d06)" }}
      >
        <div className="text-white text-xl">Cargando partidos...</div>
      </div>
    )
  }
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to right, #0857b5, #e266be, #ff6d06)" }}
      >
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  const normalizedStatus = (s: string) => (s === "en vivo" || s === "en_vivo" ? "en_vivo" : s)

  const liveGames = filteredGames(games.filter((g) => normalizedStatus(g.status) === "en_vivo"))
  const upcomingGames = filteredGames(
    games
      .filter((g) => normalizedStatus(g.status) === "programado")
      .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()),
  )
  const finishedGames = filteredGames(
    games
      .filter((g) => normalizedStatus(g.status) === "finalizado")
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()),
  )

  const renderTeam = (name: string, isHome = true) => {
    const logo = getTeamLogo(name)
    const colors = getTeamColors(name)

    return (
      <div className="flex flex-col items-center text-center flex-1">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 overflow-hidden border-2 border-white/30"
          style={{ background: `linear-gradient(135deg, ${colors.color1}, ${colors.color2})` }}
        >
          {logo ? (
            <img
              src={logo || "/placeholder.svg"}
              alt={`Logo de ${name}`}
              className="h-full w-full object-cover rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                const parent = target.parentElement
                if (parent) {
                  target.style.display = "none"
                  parent.innerHTML = `<span class="text-xl font-bold">${name.charAt(0)}</span>`
                }
              }}
            />
          ) : (
            name.charAt(0)
          )}
        </div>
        <span className="font-semibold text-sm text-white text-center leading-tight max-w-[80px]">{name}</span>
      </div>
    )
  }

  const ShareButtons = ({ game }: { game: Game }) => (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => shareGame(game, "whatsapp")}
          className="bg-green-500 hover:bg-green-600 text-white border-0"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          WhatsApp
        </Button>
        <Button
          size="sm"
          onClick={() => shareGame(game, "instagram")}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          <Instagram className="w-4 h-4 mr-1" />
          Instagram
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => shareGame(game, "copy")}
        className="bg-white/90 hover:bg-white border-gray-300"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copiar
      </Button>
    </div>
  )

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
              {"🏈 Calendario de Partidos - Liga Flag Durango"}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Partidos
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                2025
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Sigue todos los partidos de la temporada actual.
              <span className="block mt-2 text-yellow-300 font-semibold">¡No te pierdas ningún juego!</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
                onClick={() => (window.location.href = "/equipos")}
              >
                <Users className="w-5 h-5 mr-2" />
                Ver Equipos
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold"
                onClick={() => (window.location.href = "/estadisticas")}
              >
                <Trophy className="w-5 h-5 mr-2" />
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

      {/* Filtros */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar equipos, venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                <option value="varonil-gold">Varonil Gold</option>
                <option value="varonil-silver">Varonil Silver</option>
                <option value="femenil-gold">Femenil Gold</option>
                <option value="femenil-silver">Femenil Silver</option>
                <option value="femenil-cooper">Femenil Cooper</option>
                <option value="mixto-gold">Mixto Gold</option>
                <option value="mixto-silver">Mixto Silver</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="programado">Programados</option>
                <option value="en_vivo">En Vivo</option>
                <option value="finalizado">Finalizados</option>
              </select>
              <select
                value={matchTypeFilter}
                onChange={(e) => setMatchTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="jornada">Jornada</option>
                <option value="amistoso">Amistoso</option>
                <option value="playoff">Playoff</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 lg:p-6">
        {/* EN VIVO */}
        {liveGames.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>🔴 PARTIDOS EN VIVO
              </h2>
              <p className="text-gray-600 text-lg">Partidos que se están jugando ahora mismo</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {liveGames.map((game) => (
                <Card
                  key={game.id}
                  className="border-2 border-red-500 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #0857b5, #e266be, #ff6d06)",
                  }}
                >
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-8 flex-1">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm text-white/80">
                            {new Date(game.game_date).toLocaleDateString("es-ES")}
                          </p>
                          <p className="font-semibold text-white">{game.game_time}</p>
                        </div>

                        {/* Contenedor principal del marcador */}
                        <div className="flex items-center justify-center gap-4 flex-1 max-w-2xl mx-auto">
                          {/* Equipo Local */}
                          {renderTeam(game.home_team, true)}

                          {/* Marcador */}
                          <div className="flex flex-col items-center justify-center min-w-[120px]">
                            <div className="text-4xl font-bold text-white animate-pulse text-center">
                              {game.home_score ?? 0} - {game.away_score ?? 0}
                            </div>
                            <div className="text-xs text-white/80 mt-1">EN VIVO</div>
                          </div>

                          {/* Equipo Visitante */}
                          {renderTeam(game.away_team, false)}
                        </div>

                        <div className="text-sm text-white/90 min-w-[150px]">
                          <p className="font-medium flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {game.venue}
                          </p>
                          <p className="text-white/70">{game.field}</p>
                          <p className="text-white/70 flex items-center mt-1">
                            <Whistle className="w-4 h-4 mr-1" />
                            {getReferees(game)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Badge className={`${getCategoryColor(game.category)} text-white`}>
                            {getCategoryLabel(game.category)}
                          </Badge>
                          <Badge className="bg-red-500 text-white animate-pulse">🔴 EN VIVO</Badge>
                          {game.stage && game.stage !== "regular" && (
                            <Badge className="bg-white/20 text-white">{getStageLabel(game.stage)}</Badge>
                          )}
                          {game.match_type === "amistoso" && <Badge className="bg-white/20 text-white">Amistoso</Badge>}
                          {game.jornada && <Badge className="bg-white/20 text-white">J{game.jornada}</Badge>}
                        </div>
                        <ShareButtons game={game} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* PRÓXIMOS PARTIDOS */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 mr-3 text-blue-400" />
              Próximos Partidos
            </h2>
            <p className="text-gray-600 text-lg">Partidos programados para los próximos días</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingGames.length > 0 ? (
              upcomingGames.map((game) => (
                <Card
                  key={game.id}
                  className="hover:shadow-2xl transition-all duration-300 border-gray-200 transform hover:scale-105 overflow-hidden"
                >
                  <CardHeader className="p-0">
                    <div
                      className="relative h-40 flex items-center justify-center rounded-t-lg"
                      style={{
                        background: "linear-gradient(135deg, #0857b5, #e266be, #ff6d06)",
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center gap-6 p-4">
                        {renderTeam(game.home_team)}
                        <div className="text-2xl font-bold text-white">VS</div>
                        {renderTeam(game.away_team)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge className={`${getCategoryColor(game.category)} text-white`}>
                        {getCategoryLabel(game.category)}
                      </Badge>
                      <Badge className="bg-blue-600">Programado</Badge>
                      {game.stage && game.stage !== "regular" && (
                        <Badge variant="outline">{getStageLabel(game.stage)}</Badge>
                      )}
                    </div>
                    <div className="text-center text-gray-600 space-y-2">
                      <p className="flex items-center justify-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {new Date(game.game_date).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="flex items-center justify-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {game.game_time}
                      </p>
                      <p className="flex items-center justify-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        {game.venue} - {game.field}
                      </p>
                      <p className="flex items-center justify-center text-sm">
                        <Whistle className="w-4 h-4 mr-2 text-gray-500" />
                        Árbitros: {getReferees(game)}
                      </p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <ShareButtons game={game} />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay partidos programados</h3>
                    <p className="text-gray-600">Los próximos partidos aparecerán aquí una vez que sean programados.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* PARTIDOS FINALIZADOS */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Trophy className="w-8 h-8 mr-3 text-green-400" />
              Partidos Finalizados
            </h2>
            <p className="text-gray-600 text-lg">Resultados de los partidos más recientes</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishedGames.length > 0 ? (
              finishedGames.map((game) => (
                <Card
                  key={game.id}
                  className="hover:shadow-2xl transition-all duration-300 border-gray-200 transform hover:scale-105 overflow-hidden"
                >
                  <CardHeader className="p-0">
                    <div
                      className="relative h-40 flex items-center justify-center rounded-t-lg"
                      style={{
                        background: "linear-gradient(135deg, #0857b5, #e266be, #ff6d06)",
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center gap-6 p-4">
                        {renderTeam(game.home_team)}
                        <div className="text-3xl font-bold text-white">
                          {game.home_score ?? 0} - {game.away_score ?? 0}
                        </div>
                        {renderTeam(game.away_team)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge className={`${getCategoryColor(game.category)} text-white`}>
                        {getCategoryLabel(game.category)}
                      </Badge>
                      <Badge className="bg-green-600">Finalizado</Badge>
                      {game.stage && game.stage !== "regular" && (
                        <Badge variant="outline">{getStageLabel(game.stage)}</Badge>
                      )}
                    </div>
                    <div className="text-center text-gray-600 space-y-2">
                      <p className="flex items-center justify-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {new Date(game.game_date).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="flex items-center justify-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        {game.venue} - {game.field}
                      </p>
                      <p className="flex items-center justify-center text-sm">
                        <Whistle className="w-4 h-4 mr-2 text-gray-500" />
                        Árbitros: {getReferees(game)}
                      </p>
                      {game.mvp && (
                        <p className="flex items-center justify-center text-sm text-yellow-600">
                          <Trophy className="w-4 h-4 mr-2" /> MVP: {game.mvp}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-center pt-2">
                      <ShareButtons game={game} />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay partidos finalizados</h3>
                    <p className="text-gray-600">
                      Los resultados de los partidos aparecerán aquí una vez que finalicen.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <section className="py-16" style={{ background: "linear-gradient(to right, #0857b5, #e266be, #ff6d06)" }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Quieres participar?</h2>
          <p className="text-white/90 text-lg mb-8">Únete a la Liga Flag Durango y forma parte de la acción</p>
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
