"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Share2,
  MessageCircle,
  Instagram,
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
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

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

  const openShareModal = (game: Game) => {
    setSelectedGame(game)
    setShowShareModal(true)
  }

  const shareGame = async (game: Game, platform?: "whatsapp" | "instagram") => {
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
        alert("¡Texto copiado! Pégalo en Instagram Stories")
      } else {
        // Compartir nativo del navegador
        if (navigator.share && navigator.canShare) {
          await navigator.share({
            title: `${game.home_team} vs ${game.away_team}`,
            text: shareText,
            url: window.location.href,
          })
        } else {
          await navigator.clipboard.writeText(shareText)
          alert("¡Texto copiado al portapapeles!")
        }
      }
    } catch (error) {
      console.error("Error sharing:", error)
    } finally {
      setShowShareModal(false)
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

  const renderTeamLogo = (name: string, size = "h-16 w-16") => {
    const logo = getTeamLogo(name)
    const colors = getTeamColors(name)

    return (
      <div
        className={`${size} rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden border-2 border-white/30`}
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
    )
  }

  // Componente de tarjeta de partido estilo moderno
  const GameCard = ({ game }: { game: Game }) => {
    const statusClass =
      {
        en_vivo: "bg-red-500",
        programado: "bg-blue-500",
        finalizado: "bg-green-500",
      }[normalizedStatus(game.status)] || "bg-gray-500"

    const statusLabel =
      {
        en_vivo: "En Vivo",
        programado: "Programado",
        finalizado: "Finalizado",
      }[normalizedStatus(game.status)] || "Desconocido"

    return (
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="flex flex-col items-center">
              {renderTeamLogo(game.home_team)}
              <span className="mt-2 font-medium text-sm text-center max-w-[100px]">{game.home_team}</span>
            </div>

            <div className="text-3xl font-bold text-gray-800">
              {normalizedStatus(game.status) === "programado" ? (
                "VS"
              ) : (
                <>
                  {game.home_score ?? 0} - {game.away_score ?? 0}
                </>
              )}
            </div>

            <div className="flex flex-col items-center">
              {renderTeamLogo(game.away_team)}
              <span className="mt-2 font-medium text-sm text-center max-w-[100px]">{game.away_team}</span>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <Badge className={getCategoryColor(game.category)}>{getCategoryLabel(game.category)}</Badge>
            <Badge className={statusClass}>{statusLabel}</Badge>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(game.game_date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>

            <div className="flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2" />
              {game.game_time}
            </div>

            <div className="flex items-center justify-center">
              <MapPin className="w-4 h-4 mr-2" />
              {game.venue} - {game.field}
            </div>

            <div className="flex items-center justify-center">
              <Whistle className="w-4 h-4 mr-2" />
              Árbitros: {getReferees(game)}
            </div>

            {game.mvp && (
              <div className="flex items-center justify-center text-yellow-600">
                <Trophy className="w-4 h-4 mr-2" />
                MVP: {game.mvp}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => openShareModal(game)}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </Card>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveGames.map((game) => (
                <GameCard key={game.id} game={game} />
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
              upcomingGames.map((game) => <GameCard key={game.id} game={game} />)
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
              finishedGames.map((game) => <GameCard key={game.id} game={game} />)
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

      {/* Modal de compartir */}
      {showShareModal && selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center">Compartir partido</h3>

            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg mb-6">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  {renderTeamLogo(selectedGame.home_team, "h-12 w-12")}
                  <span className="mt-1 text-xs font-medium">{selectedGame.home_team}</span>
                </div>

                <div className="text-xl font-bold">VS</div>

                <div className="flex flex-col items-center">
                  {renderTeamLogo(selectedGame.away_team, "h-12 w-12")}
                  <span className="mt-1 text-xs font-medium">{selectedGame.away_team}</span>
                </div>
              </div>

              <div className="text-sm text-center text-gray-700">
                <p>
                  {new Date(selectedGame.game_date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p>{selectedGame.game_time}</p>
                <p>
                  {selectedGame.venue} - {selectedGame.field}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => shareGame(selectedGame, "whatsapp")}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>

              <Button
                onClick={() => shareGame(selectedGame, "instagram")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Instagram
              </Button>
            </div>

            <Button onClick={() => setShowShareModal(false)} variant="outline" className="w-full mt-4">
              Cancelar
            </Button>
          </div>
        </div>
      )}

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
