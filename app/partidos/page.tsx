"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Trophy, Users, Star, Share2 } from "lucide-react"

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
        return <Badge className="bg-red-500 text-white animate-pulse">🔴 EN VIVO</Badge>
      case "finalizado":
        return <Badge className="bg-green-500 text-white">✅ FINALIZADO</Badge>
      case "programado":
        return <Badge className="bg-blue-500 text-white">📅 PROGRAMADO</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>
    }
  }

  const filteredGames = games.filter((game) => {
    const categoryMatch = selectedCategory === "all" || game.category === selectedCategory
    const statusMatch = selectedStatus === "all" || game.status === selectedStatus
    return categoryMatch && statusMatch
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
      // Crear timestamp único para evitar conflictos
      const timestamp = Date.now()
      const tempId = `share-temp-${timestamp}`

      // Obtener el elemento original
      const originalElement = document.getElementById("share-modal-content")
      if (!originalElement) {
        console.error("No se encontró el elemento share-modal-content")
        return
      }

      // Crear un clon temporal para la captura
      const tempElement = originalElement.cloneNode(true) as HTMLElement
      tempElement.id = tempId
      tempElement.style.position = "fixed"
      tempElement.style.top = "-9999px"
      tempElement.style.left = "-9999px"
      tempElement.style.zIndex = "-1"
      tempElement.style.width = originalElement.offsetWidth + "px"
      tempElement.style.height = "auto"
      tempElement.style.visibility = "hidden"

      // Agregar al DOM temporalmente
      document.body.appendChild(tempElement)

      // Importar html2canvas dinámicamente
      const html2canvas = (await import("html2canvas")).default

      // Capturar la imagen
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempElement.scrollWidth,
        height: tempElement.scrollHeight,
      })

      // Remover elemento temporal inmediatamente
      document.body.removeChild(tempElement)

      // Crear blob y compartir
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            console.error("No se pudo crear el blob")
            return
          }

          const fileName = `partido-${selectedGame?.home_team}-vs-${selectedGame?.away_team}-${timestamp}.png`

          if (platform === "whatsapp") {
            // Intentar compartir nativamente primero
            if (navigator.share && navigator.canShare) {
              try {
                const file = new File([blob], fileName, { type: "image/png" })
                if (navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    files: [file],
                    title: "Partido Liga Flag Durango",
                    text: `${selectedGame?.home_team} vs ${selectedGame?.away_team}`,
                  })
                  return
                }
              } catch (shareError) {
                console.log("Native share failed, using fallback:", shareError)
              }
            }

            // Fallback: descargar y abrir WhatsApp
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = fileName
            link.style.display = "none"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Limpiar URL y abrir WhatsApp
            setTimeout(() => {
              URL.revokeObjectURL(url)
              window.open("https://wa.me/", "_blank")
            }, 500)
          } else if (platform === "instagram") {
            // Para Instagram, siempre descargar
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = fileName
            link.style.display = "none"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Limpiar URL y abrir Instagram
            setTimeout(() => {
              URL.revokeObjectURL(url)
              try {
                // Intentar abrir la app de Instagram
                window.location.href = "instagram://story-camera"
              } catch {
                // Si falla, abrir Instagram web
                window.open("https://www.instagram.com/", "_blank")
              }
            }, 500)
          }

          // Limpiar canvas después de un tiempo
          setTimeout(() => {
            try {
              canvas.remove()
            } catch (e) {
              console.log("Canvas already removed")
            }
          }, 1000)
        },
        "image/png",
        0.95,
      )
    } catch (error) {
      console.error("Error capturing image:", error)
      alert("Error al generar la imagen. Por favor, inténtalo de nuevo.")
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
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Partidos
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Liga Flag
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Sigue todos los partidos de la temporada 2025
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="en_vivo">En Vivo</option>
              <option value="programado">Programados</option>
              <option value="finalizado">Finalizados</option>
            </select>
          </div>
        </div>

        {/* Lista de Partidos */}
        <div className="grid gap-6">
          {sortedGames.map((game) => {
            const homeTeam = getTeamInfo(game.home_team)
            const awayTeam = getTeamInfo(game.away_team)

            return (
              <Card
                key={game.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${
                  game.status === "en_vivo" || game.status === "en vivo"
                    ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                    : game.status === "finalizado"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
                onClick={() => setSelectedGame(game)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Equipos y Marcador */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        {getStatusBadge(game.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => captureAndShare("whatsapp")}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                        >
                          <Share2 className="w-4 h-4" />
                          Compartir en WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => captureAndShare("instagram")}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                        >
                          <Share2 className="w-4 h-4" />
                          Compartir en Instagram
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        {/* Equipo Local */}
                        <div className="text-center">
                          <div className="flex flex-col items-center mb-2">
                            {homeTeam.logo_url ? (
                              <img
                                src={homeTeam.logo_url || "/placeholder.svg"}
                                alt={homeTeam.name}
                                className="w-16 h-16 object-contain mb-2"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2"
                                style={{ backgroundColor: homeTeam.color1 }}
                              >
                                {homeTeam.name.charAt(0)}
                              </div>
                            )}
                            <h3 className="font-bold text-lg text-gray-900">{game.home_team}</h3>
                          </div>
                        </div>

                        {/* Marcador */}
                        <div className="text-center">
                          {game.status === "finalizado" || game.status === "en_vivo" || game.status === "en vivo" ? (
                            <div className="text-4xl font-bold text-gray-900">
                              {game.home_score || 0} - {game.away_score || 0}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-gray-600">VS</div>
                          )}
                        </div>

                        {/* Equipo Visitante */}
                        <div className="text-center">
                          <div className="flex flex-col items-center mb-2">
                            {awayTeam.logo_url ? (
                              <img
                                src={awayTeam.logo_url || "/placeholder.svg"}
                                alt={awayTeam.name}
                                className="w-16 h-16 object-contain mb-2"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2"
                                style={{ backgroundColor: awayTeam.color1 }}
                              >
                                {awayTeam.name.charAt(0)}
                              </div>
                            )}
                            <h3 className="font-bold text-lg text-gray-900">{game.away_team}</h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del Partido */}
                    <div className="lg:w-80 space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Trophy className="w-5 h-5 mr-2" />
                        <span className="font-medium">{getCategoryLabel(game.category)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>
                          {new Date(game.game_date).toLocaleDateString("es-MX", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-5 h-5 mr-2" />
                        <span>{game.game_time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span>
                          {game.venue} - {game.field}
                        </span>
                      </div>
                      {game.jornada && (
                        <div className="flex items-center text-gray-600">
                          <Users className="w-5 h-5 mr-2" />
                          <span>Jornada {game.jornada}</span>
                        </div>
                      )}
                      {game.mvp && game.status === "finalizado" && (
                        <div className="flex items-center text-yellow-600">
                          <Star className="w-5 h-5 mr-2" />
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

      {/* Modal Content */}
      {selectedGame && (
        <div id="share-modal-content" className="hidden">
          <div
            style={{
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6, #F59E0B)",
              color: "white",
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                🏈
              </div>
              <h2 style={{ margin: "0", fontSize: "20px", fontWeight: "bold" }}>Liga Flag Durango</h2>
              <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: "0.8" }}>20 años haciendo historia</p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  backgroundColor:
                    selectedGame.status === "finalizado"
                      ? "rgba(34, 197, 94, 0.2)"
                      : selectedGame.status === "en_vivo" || selectedGame.status === "en vivo"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(59, 130, 246, 0.2)",
                  border:
                    selectedGame.status === "finalizado"
                      ? "1px solid #22C55E"
                      : selectedGame.status === "en_vivo" || selectedGame.status === "en vivo"
                        ? "1px solid #EF4444"
                        : "1px solid #3B82F6",
                  color:
                    selectedGame.status === "finalizado"
                      ? "#86EFAC"
                      : selectedGame.status === "en_vivo" || selectedGame.status === "en vivo"
                        ? "#FCA5A5"
                        : "#93C5FD",
                }}
              >
                {selectedGame.status === "finalizado"
                  ? "✅ RESULTADO FINAL"
                  : selectedGame.status === "en_vivo" || selectedGame.status === "en vivo"
                    ? "🔴 EN VIVO"
                    : "📅 PRÓXIMO PARTIDO"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: homeTeam.color1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontWeight: "bold",
                    fontSize: "24px",
                    color: "white",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {homeTeam.name.charAt(0)}
                </div>
                <p style={{ margin: "0", fontWeight: "bold", fontSize: "12px" }}>{selectedGame.home_team}</p>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: selectedGame.status === "programado" ? "24px" : "36px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {selectedGame.status === "programado"
                    ? "VS"
                    : `${selectedGame.home_score || 0} - ${selectedGame.away_score || 0}`}
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: awayTeam.color1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontWeight: "bold",
                    fontSize: "24px",
                    color: "white",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {awayTeam.name.charAt(0)}
                </div>
                <p style={{ margin: "0", fontWeight: "bold", fontSize: "12px" }}>{selectedGame.away_team}</p>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "12px", opacity: "0.9", lineHeight: "1.5" }}>
              <p style={{ margin: "0 0 4px", fontWeight: "600" }}>{getCategoryLabel(selectedGame.category)}</p>
              <p style={{ margin: "0 0 4px" }}>
                {new Date(selectedGame.game_date).toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                - {selectedGame.game_time}
              </p>
              <p style={{ margin: "0 0 4px" }}>
                {selectedGame.venue} - {selectedGame.field}
              </p>
              {selectedGame.mvp && selectedGame.status === "finalizado" ? (
                <p style={{ margin: "4px 0 0", color: "#FDE047", fontWeight: "bold" }}>⭐ MVP: {selectedGame.mvp}</p>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
