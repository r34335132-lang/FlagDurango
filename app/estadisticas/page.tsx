"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { Trophy, Target, Users, TrendingUp } from "lucide-react"
import Image from "next/image"

interface TeamStats {
  team_id: number
  team_name: string
  team_category: string
  team_logo?: string
  team_color1: string
  team_color2: string
  position: number
  games_played: number
  games_won: number
  games_lost: number
  games_tied: number
  points: number
  points_for: number
  points_against: number
  point_difference: number
  win_percentage: string
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<TeamStats[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  const categories = [
    { value: "all", label: "Todas las Categorías" },
    { value: "varonil-gold", label: "Varonil Gold" },
    { value: "varonil-silver", label: "Varonil Silver" },
    { value: "femenil-gold", label: "Femenil Gold" },
    { value: "femenil-silver", label: "Femenil Silver" },
    { value: "mixto-gold", label: "Mixto Gold" },
    { value: "mixto-silver", label: "Mixto Silver" },
  ]

  useEffect(() => {
    fetchStats()
  }, [selectedCategory])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stats?category=${selectedCategory}&season=2025`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    if (category.includes("femenil")) return "bg-pink-500"
    if (category.includes("mixto")) return "bg-orange-500"
    return "bg-blue-500"
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return "text-yellow-400"
    if (position === 2) return "text-gray-300"
    if (position === 3) return "text-orange-400"
    return "text-white"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Estadísticas</h1>
          <p className="text-gray-200">Tabla de posiciones y estadísticas de equipos</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category.value
                    ? "bg-yellow-500 text-black font-semibold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Equipos</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.length}</div>
              <p className="text-xs text-gray-300">En la categoría seleccionada</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Partidos Jugados</CardTitle>
              <Trophy className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.reduce((sum, team) => sum + team.games_played, 0)}
              </div>
              <p className="text-xs text-gray-300">Total de partidos</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Puntos Totales</CardTitle>
              <Target className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.reduce((sum, team) => sum + team.points_for, 0)}
              </div>
              <p className="text-xs text-gray-300">Puntos anotados</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Promedio por Partido</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.length > 0
                  ? (
                      stats.reduce((sum, team) => sum + team.points_for, 0) /
                      Math.max(
                        stats.reduce((sum, team) => sum + team.games_played, 0),
                        1,
                      )
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-gray-300">Puntos por partido</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Table */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Tabla de Posiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2 text-white font-semibold">Pos</th>
                    <th className="text-left py-3 px-2 text-white font-semibold">Equipo</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">PJ</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">G</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">E</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">P</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">PF</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">PC</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">DP</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">Pts</th>
                    <th className="text-center py-3 px-2 text-white font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((team) => (
                    <tr key={team.team_id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-2">
                        <span className={`font-bold text-lg ${getPositionColor(team.position)}`}>{team.position}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${team.team_color1}, ${team.team_color2})`,
                            }}
                          >
                            {team.team_logo ? (
                              <Image
                                src={team.team_logo || "/placeholder.svg"}
                                alt={team.team_name}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.textContent = team.team_name.charAt(0)
                                  }
                                }}
                              />
                            ) : (
                              team.team_name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{team.team_name}</div>
                            <Badge className={`${getCategoryColor(team.team_category)} text-white text-xs`}>
                              {team.team_category.replace("-", " ").toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2 text-white">{team.games_played}</td>
                      <td className="text-center py-3 px-2 text-green-400 font-semibold">{team.games_won}</td>
                      <td className="text-center py-3 px-2 text-yellow-400 font-semibold">{team.games_tied}</td>
                      <td className="text-center py-3 px-2 text-red-400 font-semibold">{team.games_lost}</td>
                      <td className="text-center py-3 px-2 text-white">{team.points_for}</td>
                      <td className="text-center py-3 px-2 text-white">{team.points_against}</td>
                      <td className="text-center py-3 px-2">
                        <span
                          className={`font-semibold ${
                            team.point_difference > 0
                              ? "text-green-400"
                              : team.point_difference < 0
                                ? "text-red-400"
                                : "text-gray-400"
                          }`}
                        >
                          {team.point_difference > 0 ? "+" : ""}
                          {team.point_difference}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="font-bold text-yellow-400 text-lg">{team.points}</span>
                      </td>
                      <td className="text-center py-3 px-2 text-white">{team.win_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No hay estadísticas disponibles para esta categoría.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="text-white text-sm">
                <strong>Leyenda:</strong> PJ = Partidos Jugados, G = Ganados, E = Empatados, P = Perdidos, PF = Puntos a
                Favor, PC = Puntos en Contra, DP = Diferencia de Puntos, Pts = Puntos, % = Porcentaje de Victorias
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
