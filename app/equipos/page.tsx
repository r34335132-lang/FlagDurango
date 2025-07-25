"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Phone, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Player {
  id: number
  name: string
  position: string
  jersey_number: number
  birth_date?: string
  phone?: string
  email?: string
  status: string
}

interface Team {
  id: number
  name: string
  category: string
  color1: string
  color2: string
  logo_url?: string
  captain_name?: string
  contact_phone?: string // Usar contact_phone para mapear a captain_phone
  contact_email?: string
  players: Player[] // Aseguramos que siempre sea un array
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

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // Nuevo estado para errores
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const loadTeams = async () => {
    setLoading(true)
    setError(null) // Resetear error
    try {
      console.log("🔍 Client: Fetching teams from /api/teams...")
      const response = await fetch("/api/teams")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Client: Network response was not ok:", response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log("📊 Client: Teams API response received:", data)

      if (data.success) {
        const teamsData = data.data.map((team: any) => ({
          ...team,
          players: Array.isArray(team.players) ? team.players : [], // Aseguramos que 'players' sea un array
          captain_phone: team.contact_phone, // Mapear contact_phone a captain_phone para compatibilidad
        }))

        setTeams(teamsData)
        console.log(`✅ Client: Loaded ${teamsData.length} teams.`)

        // Log detallado de jugadores por equipo en el cliente
        teamsData.forEach((team: Team) => {
          console.log(`👥 Client: Team "${team.name}" (ID: ${team.id}) has ${team.players.length} players.`)
          if (team.players.length > 0) {
            team.players.slice(0, 5).forEach((player: Player) => {
              // Mostrar hasta 5 jugadores en el log
              console.log(`    - Player: ${player.name} (#${player.jersey_number}, Pos: ${player.position})`)
            })
            if (team.players.length > 5) {
              console.log(`    ...and ${team.players.length - 5} more players.`)
            }
          }
        })
      } else {
        console.error("❌ Client: API reported an error:", data.error)
        setError(data.error || "Error al cargar equipos desde la API.")
        setTeams([])
      }
    } catch (err: any) {
      console.error("💥 Client: Error fetching teams:", err)
      setError(err.message || "Error desconocido al cargar equipos.")
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const categories = [
    { value: "all", label: "Todas las Categorías" },
    { value: "varonil-gold", label: "Varonil Gold" },
    { value: "varonil-silver", label: "Varonil Silver" },
    { value: "femenil-gold", label: "Femenil Gold" },
    { value: "femenil-silver", label: "Femenil Silver" },
    { value: "mixto-gold", label: "Mixto Gold" },
    { value: "mixto-silver", label: "Mixto Silver" },
  ]

  const filteredTeams = selectedCategory === "all" ? teams : teams.filter((team) => team.category === selectedCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "varonil-gold":
        return "bg-yellow-600"
      case "varonil-silver":
        return "bg-gray-400"
      case "femenil-gold":
        return "bg-pink-600"
      case "femenil-silver":
        return "bg-pink-400"
      case "mixto-gold":
        return "bg-purple-600"
      case "mixto-silver":
        return "bg-purple-400"
      default:
        return "bg-blue-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando equipos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error al cargar los datos:</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="mt-2 text-sm">
            Por favor, verifica tus variables de entorno de Supabase (`NEXT_PUBLIC_SUPABASE_URL`,
            `SUPABASE_SERVICE_ROLE_KEY`) y la conexión a tu base de datos.
          </p>
          <Button onClick={loadTeams} className="mt-4 bg-red-500 hover:bg-red-700 text-white">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white">Equipos</h1>
          </div>
          <div className="text-white">
            <div className="text-2xl font-bold">{filteredTeams.length}</div>
            <div className="text-sm opacity-70">equipos registrados</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={selectedCategory === category.value ? "bg-white text-black" : ""}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h3 className="text-white text-xl font-semibold mb-2">No hay equipos registrados</h3>
              <p className="text-white/70">
                {selectedCategory === "all"
                  ? "Aún no se han registrado equipos en la liga."
                  : `No hay equipos registrados en la categoría seleccionada.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${team.color1}, ${team.color2})`,
                      }}
                    >
                      {team.logo_url ? (
                        <img
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        team.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl">{team.name}</CardTitle>
                      <Badge className={`${getCategoryColor(team.category)} text-white mt-1`}>
                        {team.category.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Captain Info */}
                  {team.captain_name && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-white/90">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Capitán: {team.captain_name}</span>
                      </div>
                      {team.contact_phone && (
                        <div className="flex items-center space-x-2 text-white/70 text-sm mt-1">
                          <Phone className="w-3 h-3" />
                          <span>{team.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Team Stats */}
                  {team.stats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{team.stats.points}</div>
                        <div className="text-white/70 text-sm">Puntos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{team.stats.games_played}</div>
                        <div className="text-white/70 text-sm">Partidos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-400">{team.stats.wins}</div>
                        <div className="text-white/70 text-sm">Ganados</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-red-400">{team.stats.losses}</div>
                        <div className="text-white/70 text-sm">Perdidos</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Trophy className="w-8 h-8 mx-auto mb-2 text-white/50" />
                      <div className="text-white/70 text-sm">Sin estadísticas disponibles</div>
                    </div>
                  )}

                  {/* Players Count */}
                  <div className="flex items-center justify-between text-white/90">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Jugadores registrados</span>
                    </div>
                    <Badge variant="outline" className="text-white border-white/30">
                      {team.players?.length || 0}
                    </Badge>
                  </div>

                  {/* Players List */}
                  {team.players && team.players.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-white/90 text-sm font-medium">Plantilla:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {team.players.slice(0, 5).map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between bg-white/5 rounded px-3 py-1"
                          >
                            <span className="text-white/90 text-sm">{player.name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs text-white border-white/30">
                                #{player.jersey_number}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-white border-white/30">
                                {player.position}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {team.players.length > 5 && (
                          <div className="text-white/50 text-xs text-center py-1">
                            +{team.players.length - 5} jugadores más
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-white/50" />
                      <div className="text-white/70 text-sm">No hay jugadores registrados</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
