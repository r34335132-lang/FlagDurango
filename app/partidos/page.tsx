"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, MapPin, Clock, Trophy, Users, Star, Share2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

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
  referee1?: string
  referee2?: string
  mvp?: string
  status: string
  jornada?: number
  match_type?: string
}

interface Team {
  id: number
  name: string
  category: string
  logo_url?: string
  color1: string
  color2: string
}

export default function PartidosPage() {
  const [games, setGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const loadData = async () => {
    try {
      const [gamesResponse, teamsResponse] = await Promise.all([fetch("/api/games"), fetch("/api/teams")])

      const [gamesData, teamsData] = await Promise.all([gamesResponse.json(), teamsResponse.json()])

      if (gamesData.success) setGames(gamesData.data)
      if (teamsData.success) setTeams(teamsData.data)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getTeamInfo = (teamName: string) => {
    return (
      teams.find((t) => t.name === teamName) || {
        name: teamName,
        logo_url: null,
        color1: "#3B82F6",
        color2: "#1E40AF",
      }
    )
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "en_vivo":
      case "en vivo":
        return <Badge className="bg-red-500 text-white animate-pulse text-xs sm:text-sm">🔴 EN VIVO</Badge>
      case "finalizado":
        return <Badge className="bg-green-500 text-white text-xs sm:text-sm">✅ FINALIZADO</Badge>
      case "programado":
        return <Badge className="bg-blue-500 text-white text-xs sm:text-sm">📅 PROGRAMADO</Badge>
      default:
        return <Badge className="bg-gray-500 text-white text-xs sm:text-sm">{status}</Badge>
    }
  }

  const filteredGames = games.filter((game) => {
    const categoryMatch = selectedCategory === "all" || game.category === selectedCategory
    const statusMatch = selectedStatus === "all" || game.status === selectedStatus
    const searchMatch =
      !searchTerm ||
      game.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.venue.toLowerCase().includes(searchTerm.toLowerCase())
    return categoryMatch && statusMatch && searchMatch
  })

  const sortedGames = filteredGames.sort((a, b) => {
    // Primero en vivo, luego programados, luego finalizados
    const statusOrder = { en_vivo: 0, "en vivo": 0, programado: 1, finalizado: 2 }
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3

    if (aOrder !== bOrder) return aOrder - bOrder

    // Dentro del mismo estado, ordenar por fecha
    return new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  })

  const captureAndShare = async (platform: "whatsapp" | "instagram") => {
    try {
      // Importar html2canvas dinámicamente para evitar problemas de SSR
      const html2canvas = (await import("html2canvas")).default

      const element = document.getElementById("share-modal-content")
      if (!element) return

      // Crear un nuevo canvas cada vez para evitar limitaciones
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        height: element.scrollHeight,
        width: element.scrollWidth,
        logging: false, // Desactivar logs
        removeContainer: true, // Limpiar después de usar
      })

      // Crear blob y URL únicos cada vez
      canvas.toBlob(
        (blob) => {
          if (!blob) return

          // Crear URL único con timestamp
          const timestamp = Date.now()
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `partido-${selectedGame?.home_team}-vs-${selectedGame?.away_team}-${timestamp}.png`

          if (platform === "whatsapp") {
            // Intentar compartir nativamente, si no funciona descargar
            if (
              navigator.share &&
              navigator.canShare &&
              navigator.canShare({ files: [new File([blob], `partido-${timestamp}.png`, { type: "image/png" })] })
            ) {
              navigator
                .share({
                  files: [new File([blob], `partido-${timestamp}.png`, { type: "image/png" })],
                  title: "Partido Liga Flag Durango",
                })
                .catch(() => {
                  link.click()
                  setTimeout(() => window.open("https://wa.me/", "_blank"), 500)
                })
            } else {
              link.click()
              setTimeout(() => window.open("https://wa.me/", "_blank"), 500)
            }
          } else if (platform === "instagram") {
            link.click()
            setTimeout(() => {
              try {
                window.location.href = "instagram://story-camera"
              } catch {
                window.open("https://www.instagram.com/", "_blank")
              }
            }, 500)
          }

          // Limpiar URL después de un tiempo
          setTimeout(() => {
            URL.revokeObjectURL(url)
            // Limpiar canvas
            canvas.remove()
          }, 2000)
        },
        "image/png",
        0.95,
      )
    } catch (error) {
      console.error("Error capturing image:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 flex items-center justify-center">
        <div className="text-white text-xl">Cargando partidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative py-12 sm:py-16 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6">
              Partidos
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Liga Flag
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 leading-relaxed px-4">
              Sigue todos los partidos de la temporada 2025
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Filtros */}
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar equipos o venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Filtros en grid responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Todas las categorías</option>
                <option value="varonil-gold">Varonil Gold</option>
                <option value="varonil-silver">Varonil Silver</option>
                <option value="femenil-gold">Femenil Gold</option>
                <option value="femenil-silver">Femenil Silver</option>
                <option value="femenil-cooper">Femenil Cooper</option>
                <option value="mixto-gold">Mixto Gold</option>
                <option value="mixto-silver">Mixto Silver</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="en_vivo">En Vivo</option>
                <option value="programado">Programados</option>
                <option value="finalizado">Finalizados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Partidos */}
        <div className="grid gap-4 sm:gap-6">
          {sortedGames.map((game) => {
            const homeTeam = getTeamInfo(game.home_team)
            const awayTeam = getTeamInfo(game.away_team)

            return (
              <Card
                key={game.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  game.status === "en_vivo" || game.status === "en vivo"
                    ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                    : game.status === "finalizado"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Header con estado y botón compartir */}
                  <div className="flex items-center justify-between mb-4">
                    {getStatusBadge(game.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGame(game)
                        setShareModalOpen(true)
                      }}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Compartir</span>
                      <span className="sm:hidden">📤</span>
                    </Button>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                    {/* Equipos y Marcador */}
                    <div className="flex-1">
                      <div className="grid grid-cols-3 items-center gap-2 sm:gap-4">
                        {/* Equipo Local */}
                        <div className="text-center">
                          <div className="flex flex-col items-center mb-2">
                            {homeTeam.logo_url ? (
                              <img
                                src={homeTeam.logo_url || "/placeholder.svg"}
                                alt={homeTeam.name}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1 sm:mb-2"
                              />
                            ) : (
                              <div
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-xl mb-1 sm:mb-2"
                                style={{ backgroundColor: homeTeam.color1 }}
                              >
                                {homeTeam.name.charAt(0)}
                              </div>
                            )}
                            <h3 className="font-bold text-xs sm:text-lg text-gray-900 leading-tight">
                              {game.home_team}
                            </h3>
                          </div>
                        </div>

                        {/* Marcador */}
                        <div className="text-center">
                          {game.status === "finalizado" || game.status === "en_vivo" || game.status === "en vivo" ? (
                            <div className="text-2xl sm:text-4xl font-bold text-gray-900">
                              {game.home_score || 0} - {game.away_score || 0}
                            </div>
                          ) : (
                            <div className="text-xl sm:text-2xl font-bold text-gray-600">VS</div>
                          )}
                        </div>

                        {/* Equipo Visitante */}
                        <div className="text-center">
                          <div className="flex flex-col items-center mb-2">
                            {awayTeam.logo_url ? (
                              <img
                                src={awayTeam.logo_url || "/placeholder.svg"}
                                alt={awayTeam.name}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1 sm:mb-2"
                              />
                            ) : (
                              <div
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-xl mb-1 sm:mb-2"
                                style={{ backgroundColor: awayTeam.color1 }}
                              >
                                {awayTeam.name.charAt(0)}
                              </div>
                            )}
                            <h3 className="font-bold text-xs sm:text-lg text-gray-900 leading-tight">
                              {game.away_team}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del Partido */}
                    <div className="lg:w-80 space-y-2 sm:space-y-3">
                      <div className="flex items-center text-gray-600 text-sm sm:text-base">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        <span className="font-medium">{getCategoryLabel(game.category)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm sm:text-base">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-base">
                          {new Date(game.game_date).toLocaleDateString("es-MX", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm sm:text-base">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        <span>{game.game_time}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm sm:text-base">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-base">
                          {game.venue} - {game.field}
                        </span>
                      </div>
                      {game.jornada && (
                        <div className="flex items-center text-gray-600 text-sm sm:text-base">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span>Jornada {game.jornada}</span>
                        </div>
                      )}
                      {game.mvp && game.status === "finalizado" && (
                        <div className="flex items-center text-yellow-600 text-sm sm:text-base">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span className="font-medium">MVP: {game.mvp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {sortedGames.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay partidos</h3>
            <p className="text-gray-500">No se encontraron partidos con los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Modal de Compartir */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-auto p-0 overflow-hidden">
          <div
            id="share-modal-content"
            className="bg-gradient-to-br from-blue-500 via-purple-600 to-orange-500 text-white"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 text-center border-b border-white/20">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Liga Flag Durango</h2>
              <p className="text-white/80 text-xs sm:text-sm">20 años haciendo historia</p>
            </div>

            {/* Contenido del Partido */}
            {selectedGame && (
              <div className="p-4 sm:p-6">
                {/* Estado */}
                <div className="text-center mb-3 sm:mb-4">
                  {selectedGame.status === "finalizado" && (
                    <div className="bg-green-500/20 border border-green-400 rounded-lg px-3 py-2 inline-block">
                      <span className="text-green-200 font-bold text-sm">✅ RESULTADO FINAL</span>
                    </div>
                  )}
                  {(selectedGame.status === "en_vivo" || selectedGame.status === "en vivo") && (
                    <div className="bg-red-500/20 border border-red-400 rounded-lg px-3 py-2 inline-block animate-pulse">
                      <span className="text-red-200 font-bold text-sm">🔴 EN VIVO</span>
                    </div>
                  )}
                  {selectedGame.status === "programado" && (
                    <div className="bg-blue-500/20 border border-blue-400 rounded-lg px-3 py-2 inline-block">
                      <span className="text-blue-200 font-bold text-sm">📅 PRÓXIMO PARTIDO</span>
                    </div>
                  )}
                </div>

                {/* Equipos */}
                <div className="grid grid-cols-3 items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {/* Equipo Local */}
                  <div className="text-center">
                    {getTeamInfo(selectedGame.home_team).logo_url ? (
                      <img
                        src={getTeamInfo(selectedGame.home_team).logo_url || "/placeholder.svg"}
                        alt={selectedGame.home_team}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto mb-1 sm:mb-2"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-xl mx-auto mb-1 sm:mb-2 shadow-lg"
                        style={{ backgroundColor: getTeamInfo(selectedGame.home_team).color1 }}
                      >
                        {selectedGame.home_team.charAt(0)}
                      </div>
                    )}
                    <p className="font-bold text-xs sm:text-sm leading-tight">{selectedGame.home_team}</p>
                  </div>

                  {/* Marcador */}
                  <div className="text-center">
                    {selectedGame.status === "finalizado" ||
                    selectedGame.status === "en_vivo" ||
                    selectedGame.status === "en vivo" ? (
                      <div className="text-2xl sm:text-4xl font-bold">
                        {selectedGame.home_score || 0} - {selectedGame.away_score || 0}
                      </div>
                    ) : (
                      <div className="text-xl sm:text-2xl font-bold text-white/80">VS</div>
                    )}
                  </div>

                  {/* Equipo Visitante */}
                  <div className="text-center">
                    {getTeamInfo(selectedGame.away_team).logo_url ? (
                      <img
                        src={getTeamInfo(selectedGame.away_team).logo_url || "/placeholder.svg"}
                        alt={selectedGame.away_team}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto mb-1 sm:mb-2"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-xl mx-auto mb-1 sm:mb-2 shadow-lg"
                        style={{ backgroundColor: getTeamInfo(selectedGame.away_team).color1 }}
                      >
                        {selectedGame.away_team.charAt(0)}
                      </div>
                    )}
                    <p className="font-bold text-xs sm:text-sm leading-tight">{selectedGame.away_team}</p>
                  </div>
                </div>

                {/* Información */}
                <div className="space-y-1 sm:space-y-2 text-center text-white/90 text-xs sm:text-sm">
                  <p className="font-semibold">{getCategoryLabel(selectedGame.category)}</p>
                  <p>
                    {new Date(selectedGame.game_date).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    - {selectedGame.game_time}
                  </p>
                  <p>
                    {selectedGame.venue} - {selectedGame.field}
                  </p>
                  {selectedGame.mvp && selectedGame.status === "finalizado" && (
                    <p className="text-yellow-300 font-semibold">⭐ MVP: {selectedGame.mvp}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones de Compartir */}
          <div className="p-3 sm:p-4 bg-white">
            <DialogHeader className="mb-3 sm:mb-4">
              <DialogTitle className="text-center text-gray-900 text-sm sm:text-base">Compartir Partido</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                onClick={() => captureAndShare("whatsapp")}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 sm:py-3 text-sm"
              >
                📱 WhatsApp
              </Button>
              <Button
                onClick={() => captureAndShare("instagram")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 sm:py-3 text-sm"
              >
                📸 Instagram
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3">
              Se descargará la imagen para compartir en historias
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
