"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Users,
  Target,
  Clock,
  Medal,
  FlameIcon as Fire,
  Crown,
  Sword,
  Shield,
  Play,
  User,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Award,
  Flame,
  Settings,
} from "lucide-react"

interface Participant {
  id: number
  player_name: string
  email: string
  phone: string
  category: string
  status: string
  alias?: string
  image_url?: string
  created_at: string
}

interface Match {
  id: number
  tournament_id: number
  participant1_id: number
  participant2_id: number
  participant1_score: number
  participant2_score: number
  winner_id?: number
  round: string
  bracket_type: string
  status: string
  match_number: number
  elimination_match: boolean
  participant1?: Participant
  participant2?: Participant
  winner?: Participant
}

interface Stats {
  id: number
  participant_id: number
  matches_played: number
  matches_won: number
  matches_lost: number
  points_scored: number
  points_against: number
  win_percentage: number
  point_differential: number
  bracket_type: string
  lives_remaining: number
  ranking: number
  participant: Participant
}

interface Tournament {
  id: number
  name: string
  description: string
  entry_fee: number
  max_participants: number
  status: string
}

export default function WildBrowlPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Form states
  const [formData, setFormData] = useState({
    player_name: "",
    email: "",
    phone: "",
    category: "varonil",
    alias: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  const loadData = async () => {
    try {
      const [participantsRes, matchesRes, statsRes, tournamentRes] = await Promise.all([
        fetch("/api/wildbrowl/participants"),
        fetch("/api/wildbrowl/matches"),
        fetch("/api/wildbrowl/stats"),
        fetch("/api/wildbrowl/tournament"),
      ])

      const [participantsData, matchesData, statsData, tournamentData] = await Promise.all([
        participantsRes.json(),
        matchesRes.json(),
        statsRes.json(),
        tournamentRes.json(),
      ])

      if (participantsData.success) setParticipants(participantsData.data || [])
      if (matchesData.success) setMatches(matchesData.data || [])
      if (statsData.success) {
        // Combinar todas las categorías en un solo array
        const allStats = [
          ...(statsData.data?.varonil || []),
          ...(statsData.data?.femenil || []),
          ...(statsData.data?.mixto || []),
        ]
        setStats(allStats)
      }
      if (tournamentData.success && tournamentData.data?.length > 0) {
        setTournament(tournamentData.data[0])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMessage("")

    try {
      const response = await fetch("/api/wildbrowl/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitMessage("¡Registro exitoso! Te contactaremos pronto para el pago.")
        setFormData({ player_name: "", email: "", phone: "", category: "varonil", alias: "" })
        loadData() // Recargar datos
      } else {
        setSubmitMessage(data.error || "Error en el registro")
      }
    } catch (error) {
      setSubmitMessage("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateBracket = async (category: string) => {
    try {
      const response = await fetch("/api/wildbrowl/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_bracket",
          category: category,
          tournament_id: 1,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitMessage(`Bracket generado exitosamente para categoría ${category}`)
        loadData() // Recargar datos
      } else {
        setSubmitMessage(data.error || "Error generando bracket")
      }
    } catch (error) {
      setSubmitMessage("Error de conexión")
    }
  }

  // Filtrar datos por categoría
  const getParticipantsByCategory = (category: string) => participants.filter((p) => p.category === category)

  const getMatchesByCategory = (category: string) =>
    matches.filter((m) => {
      const p1 = participants.find((p) => p.id === m.participant1_id)
      return p1?.category === category
    })

  const getStatsByCategory = (category: string) => stats.filter((s) => s.participant?.category === category)

  // Partidos en vivo
  const liveMatches = matches.filter((m) => m.status === "en_vivo" || m.status === "live")

  // Próximos partidos
  const upcomingMatches = matches.filter((m) => m.status === "programado" || m.status === "scheduled").slice(0, 6)

  // Estadísticas generales
  const totalParticipants = participants.length
  const totalMatches = matches.length
  const completedMatches = matches.filter((m) => m.status === "finalizado" || m.status === "completed").length
  const activeParticipants = participants.filter((p) => p.status === "active").length

  // Función para obtener el ícono de categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "varonil":
        return <Sword className="w-5 h-5" />
      case "femenil":
        return <Crown className="w-5 h-5" />
      case "mixto":
        return <Shield className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  // Función para obtener el color de categoría
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "varonil":
        return "from-blue-500 to-blue-700"
      case "femenil":
        return "from-pink-500 to-pink-700"
      case "mixto":
        return "from-purple-500 to-purple-700"
      default:
        return "from-gray-500 to-gray-700"
    }
  }

  // Función para renderizar bracket
  const renderBracket = (category: string) => {
    const categoryMatches = getMatchesByCategory(category)
    const categoryParticipants = getParticipantsByCategory(category)
    const winnersBracket = categoryMatches.filter((m) => m.bracket_type === "winners")
    const losersBracket = categoryMatches.filter((m) => m.bracket_type === "losers")
    const finalMatch = categoryMatches.find((m) => m.round === "champion_of_champions")

    const rounds = ["primera_ronda", "16avos", "octavos", "cuartos", "semifinal", "final"]

    return (
      <div className="space-y-8">
        {/* Información de la categoría */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            {getCategoryIcon(category)}
            <h3 className="text-2xl font-bold ml-2 capitalize">{category}</h3>
          </div>
          <div className="flex justify-center space-x-4 text-sm">
            <span>Participantes: {categoryParticipants.length}</span>
            <span>Partidos: {categoryMatches.length}</span>
            <span>Completados: {categoryMatches.filter((m) => m.status === "finalizado").length}</span>
          </div>
          {categoryParticipants.length >= 2 && categoryMatches.length === 0 && (
            <Button onClick={() => handleGenerateBracket(category)} className="mt-4 bg-green-600 hover:bg-green-700">
              <Settings className="w-4 h-4 mr-2" />
              Generar Bracket
            </Button>
          )}
        </div>

        {categoryMatches.length === 0 && categoryParticipants.length < 2 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Se necesitan al menos 2 participantes para generar el bracket</p>
            <p className="text-sm">Participantes actuales: {categoryParticipants.length}</p>
          </div>
        )}

        {categoryMatches.length === 0 && categoryParticipants.length >= 2 && (
          <div className="text-center py-12 text-gray-500">
            <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Bracket no generado aún</p>
            <p className="text-sm">Haz clic en "Generar Bracket" para crear los enfrentamientos</p>
          </div>
        )}

        {/* Winners Bracket */}
        {winnersBracket.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              Winners Bracket
            </h4>
            <div className="grid gap-4">
              {rounds.map((round) => {
                const roundMatches = winnersBracket.filter((m) => m.round === round)
                if (roundMatches.length === 0) return null

                return (
                  <div key={round} className="space-y-2">
                    <h5 className="font-semibold text-green-700 capitalize">{round.replace("_", " ")}</h5>
                    <div className="grid gap-2">
                      {roundMatches.map((match) => (
                        <Card key={match.id} className="bg-white border-green-200 hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {match.participant1?.player_name || match.participant1?.alias || "TBD"}
                                  </span>
                                  <Badge variant={match.status === "finalizado" ? "default" : "secondary"}>
                                    {match.participant1_score}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {match.participant2?.player_name || match.participant2?.alias || "TBD"}
                                  </span>
                                  <Badge variant={match.status === "finalizado" ? "default" : "secondary"}>
                                    {match.participant2_score}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    match.status === "en_vivo"
                                      ? "destructive"
                                      : match.status === "finalizado"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className={match.status === "en_vivo" ? "animate-pulse" : ""}
                                >
                                  {match.status === "en_vivo"
                                    ? "🔴 EN VIVO"
                                    : match.status === "finalizado"
                                      ? "Finalizado"
                                      : "Programado"}
                                </Badge>
                                {match.winner && (
                                  <div className="text-sm text-green-600 font-medium mt-1">
                                    Ganador: {match.winner.player_name || match.winner.alias}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Losers Bracket */}
        {losersBracket.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
            <h4 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
              <Fire className="w-6 h-6 mr-2" />
              Losers Bracket
            </h4>
            <div className="grid gap-4">
              {["losers_r1", "losers_r2", "losers_r3", "losers_semifinal", "losers_final"].map((round) => {
                const roundMatches = losersBracket.filter((m) => m.round === round)
                if (roundMatches.length === 0) return null

                return (
                  <div key={round} className="space-y-2">
                    <h5 className="font-semibold text-orange-700 capitalize">
                      {round.replace("losers_", "").replace("_", " ")}
                    </h5>
                    <div className="grid gap-2">
                      {roundMatches.map((match) => (
                        <Card key={match.id} className="bg-white border-orange-200 hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {match.participant1?.player_name || match.participant1?.alias || "TBD"}
                                  </span>
                                  <Badge variant={match.status === "finalizado" ? "default" : "secondary"}>
                                    {match.participant1_score}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {match.participant2?.player_name || match.participant2?.alias || "TBD"}
                                  </span>
                                  <Badge variant={match.status === "finalizado" ? "default" : "secondary"}>
                                    {match.participant2_score}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    match.status === "en_vivo"
                                      ? "destructive"
                                      : match.status === "finalizado"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className={match.status === "en_vivo" ? "animate-pulse" : ""}
                                >
                                  {match.status === "en_vivo"
                                    ? "🔴 EN VIVO"
                                    : match.status === "finalizado"
                                      ? "Finalizado"
                                      : "Programado"}
                                </Badge>
                                {match.elimination_match && (
                                  <div className="text-xs text-red-600 font-medium mt-1">⚠️ Eliminación</div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Final Suprema */}
        {finalMatch && (
          <div className="bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 p-8 rounded-2xl border-4 border-yellow-300 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full font-bold text-lg mb-4">
                <Crown className="w-6 h-6 mr-2" />
                FINAL SUPREMA
                <Crown className="w-6 h-6 ml-2" />
              </div>
              <h4 className="text-2xl font-bold text-yellow-800">
                Campeón de Campeones - {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>
            </div>

            <Card className="bg-white border-yellow-300 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-8 h-8 text-green-600" />
                        <div>
                          <div className="font-bold text-lg text-green-800">
                            {finalMatch.participant1?.player_name ||
                              finalMatch.participant1?.alias ||
                              "Campeón Winners"}
                          </div>
                          <div className="text-sm text-green-600">Winners Bracket Champion</div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-green-800">{finalMatch.participant1_score}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">VS</div>
                    </div>

                    <div className="flex items-center justify-between bg-gradient-to-r from-orange-100 to-orange-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Fire className="w-8 h-8 text-orange-600" />
                        <div>
                          <div className="font-bold text-lg text-orange-800">
                            {finalMatch.participant2?.player_name || finalMatch.participant2?.alias || "Campeón Losers"}
                          </div>
                          <div className="text-sm text-orange-600">Losers Bracket Champion</div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-orange-800">{finalMatch.participant2_score}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <Badge
                    variant={
                      finalMatch.status === "en_vivo"
                        ? "destructive"
                        : finalMatch.status === "finalizado"
                          ? "default"
                          : "secondary"
                    }
                    className={`text-lg px-6 py-2 ${finalMatch.status === "en_vivo" ? "animate-pulse" : ""}`}
                  >
                    {finalMatch.status === "en_vivo"
                      ? "🔴 EN VIVO AHORA"
                      : finalMatch.status === "finalizado"
                        ? "👑 COMPLETADO"
                        : "⏳ PRÓXIMAMENTE"}
                  </Badge>

                  {finalMatch.winner && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-800 flex items-center justify-center">
                        <Crown className="w-8 h-8 mr-2" />
                        CAMPEÓN: {finalMatch.winner.player_name || finalMatch.winner.alias}
                        <Crown className="w-8 h-8 ml-2" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
          Cargando WildBrowl...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-600">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-yellow-400/95 backdrop-blur-sm text-gray-900 px-6 py-2 rounded-full font-bold mb-6 border border-black/10 shadow-lg">
              🎯 Torneo Individual 1v1 - ¡Inscripciones Abiertas!
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Wild
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Browl
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              El torneo más intenso de flag football individual.
              <span className="block mt-2 text-yellow-300 font-semibold">¡Demuestra que eres el mejor 1 contra 1!</span>
            </p>

            {/* Estadísticas en tiempo real */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{totalParticipants}</div>
                <div className="text-sm text-white/80">Inscritos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{activeParticipants}</div>
                <div className="text-sm text-white/80">Activos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{completedMatches}</div>
                <div className="text-sm text-white/80">Partidos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">${tournament?.entry_fee || 100}</div>
                <div className="text-sm text-white/80">Inscripción</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
                onClick={() => setActiveTab("register")}
              >
                <Target className="w-5 h-5 mr-2" />
                Inscribirse Ahora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
                onClick={() => setActiveTab("bracket")}
              >
                Ver Brackets
                <Sword className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partidos en Vivo */}
      {liveMatches.length > 0 && (
        <section className="py-8 bg-red-50 border-b-4 border-red-200">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-red-800 mb-6 flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              PARTIDOS EN VIVO
              <div className="w-3 h-3 bg-red-500 rounded-full ml-3 animate-pulse"></div>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <Card key={match.id} className="bg-white border-red-200 hover:shadow-lg transition-all animate-pulse">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge className="mb-4 bg-red-500 text-white animate-pulse">🔴 EN VIVO</Badge>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            {match.participant1?.player_name || match.participant1?.alias}
                          </span>
                          <span className="text-2xl font-bold">{match.participant1_score}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-500">VS</div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            {match.participant2?.player_name || match.participant2?.alias}
                          </span>
                          <span className="text-2xl font-bold">{match.participant2_score}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-600">
                        {match.round} - {match.bracket_type}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contenido Principal */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="flex items-center">
              <Trophy className="w-4 h-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Registro
            </TabsTrigger>
            <TabsTrigger value="bracket" className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Brackets
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center">
              <Medal className="w-4 h-4 mr-2" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center">
              <Play className="w-4 h-4 mr-2" />
              Partidos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="overview" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Resumen del Torneo</h2>
              <p className="text-gray-600 text-lg">Estado actual del WildBrowl Tournament 2025</p>
              {submitMessage && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                  {submitMessage}
                </div>
              )}
            </div>

            {/* Estadísticas Generales */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-blue-800">{totalParticipants}</h3>
                  <p className="text-blue-600">Total Inscritos</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-green-800">{activeParticipants}</h3>
                  <p className="text-green-600">Participantes Activos</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Play className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-purple-800">{completedMatches}</h3>
                  <p className="text-purple-600">Partidos Jugados</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-yellow-800">${tournament?.entry_fee || 100}</h3>
                  <p className="text-yellow-600">Costo de Inscripción</p>
                </CardContent>
              </Card>
            </div>

            {/* Participantes por Categoría */}
            <div className="grid md:grid-cols-3 gap-6">
              {["varonil", "femenil", "mixto"].map((category) => {
                const categoryParticipants = getParticipantsByCategory(category)
                const categoryMatches = getMatchesByCategory(category)

                return (
                  <Card key={category} className="hover:shadow-lg transition-all">
                    <CardHeader className={`bg-gradient-to-r ${getCategoryColor(category)} text-white`}>
                      <CardTitle className="flex items-center">
                        {getCategoryIcon(category)}
                        <span className="ml-2 capitalize">{category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Inscritos:</span>
                          <span className="font-bold text-lg">{categoryParticipants.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Partidos:</span>
                          <span className="font-bold text-lg">{categoryMatches.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Activos:</span>
                          <span className="font-bold text-lg">
                            {categoryParticipants.filter((p) => p.status === "active").length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Button className="w-full" onClick={() => setActiveTab("bracket")}>
                            Ver Bracket
                          </Button>
                          {categoryParticipants.length >= 2 && categoryMatches.length === 0 && (
                            <Button
                              onClick={() => handleGenerateBracket(category)}
                              className="w-full bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Generar Bracket
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Tab: Registro */}
          <TabsContent value="register" className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="text-2xl flex items-center">
                  <Target className="w-6 h-6 mr-2" />
                  Registro WildBrowl 2025
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="player_name" className="text-gray-700 font-medium">
                        Nombre Completo *
                      </Label>
                      <Input
                        id="player_name"
                        type="text"
                        value={formData.player_name}
                        onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                        required
                        className="mt-1"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="alias" className="text-gray-700 font-medium">
                        Alias/Apodo
                      </Label>
                      <Input
                        id="alias"
                        type="text"
                        value={formData.alias}
                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                        className="mt-1"
                        placeholder="Tu alias (opcional)"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-1"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      Teléfono *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="mt-1"
                      placeholder="618-123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-gray-700 font-medium">
                      Categoría *
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="varonil">Varonil</option>
                      <option value="femenil">Femenil</option>
                      <option value="mixto">Mixto</option>
                    </select>
                  </div>

                  {/* Información del torneo */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-yellow-800 mb-3 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Información Importante
                    </h3>
                    <ul className="space-y-2 text-sm text-yellow-700">
                      <li>
                        • Costo de inscripción: <strong>${tournament?.entry_fee || 100} MXN</strong>
                      </li>
                      <li>• Formato: Doble eliminación</li>
                      <li>• Máximo {tournament?.max_participants || 32} participantes por categoría</li>
                      <li>• Se requiere pago para confirmar inscripción</li>
                      <li>• Las inscripciones cierran cuando se complete el cupo</li>
                      <li>• Funciona con cualquier número de participantes (mínimo 2)</li>
                    </ul>
                  </div>

                  {submitMessage && (
                    <div
                      className={`p-4 rounded-lg ${
                        submitMessage.includes("exitoso")
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {submitMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 text-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Inscribirse al WildBrowl
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Brackets */}
          <TabsContent value="bracket" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Brackets del Torneo</h2>
              <p className="text-gray-600 text-lg">Sistema de doble eliminación por categoría</p>
              <p className="text-sm text-gray-500 mt-2">
                Funciona con cualquier número de participantes. Prueba con 6-7 jugadores, luego con 16 o 32.
              </p>
            </div>

            <Tabs defaultValue="varonil" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="varonil" className="flex items-center">
                  <Sword className="w-4 h-4 mr-2" />
                  Varonil
                </TabsTrigger>
                <TabsTrigger value="femenil" className="flex items-center">
                  <Crown className="w-4 h-4 mr-2" />
                  Femenil
                </TabsTrigger>
                <TabsTrigger value="mixto" className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Mixto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="varonil">{renderBracket("varonil")}</TabsContent>
              <TabsContent value="femenil">{renderBracket("femenil")}</TabsContent>
              <TabsContent value="mixto">{renderBracket("mixto")}</TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab: Rankings */}
          <TabsContent value="rankings" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Rankings por Categoría</h2>
              <p className="text-gray-600 text-lg">Clasificación actual de participantes</p>
            </div>

            <Tabs defaultValue="varonil" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="varonil">Varonil</TabsTrigger>
                <TabsTrigger value="femenil">Femenil</TabsTrigger>
                <TabsTrigger value="mixto">Mixto</TabsTrigger>
              </TabsList>

              {["varonil", "femenil", "mixto"].map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="space-y-4">
                    {getStatsByCategory(category)
                      .sort((a, b) => {
                        if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won
                        if (b.point_differential !== a.point_differential)
                          return b.point_differential - a.point_differential
                        return b.win_percentage - a.win_percentage
                      })
                      .map((stat, index) => (
                        <Card
                          key={stat.id}
                          className={`hover:shadow-lg transition-all ${
                            index === 0
                              ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100"
                              : index === 1
                                ? "border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100"
                                : index === 2
                                  ? "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100"
                                  : "border-gray-200"
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300">
                                  {index === 0 && <Crown className="w-6 h-6 text-yellow-600" />}
                                  {index === 1 && <Medal className="w-6 h-6 text-gray-600" />}
                                  {index === 2 && <Award className="w-6 h-6 text-orange-600" />}
                                  {index > 2 && <span className="font-bold text-gray-600">#{index + 1}</span>}
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">
                                    {stat.participant?.player_name || "Participante"}
                                  </h3>
                                  {stat.participant?.alias && (
                                    <p className="text-gray-600">"{stat.participant.alias}"</p>
                                  )}
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                    <span>
                                      Estado:{" "}
                                      {stat.bracket_type === "winners"
                                        ? "🏆 Winners"
                                        : stat.bracket_type === "losers"
                                          ? "🔥 Losers"
                                          : stat.bracket_type === "eliminated"
                                            ? "❌ Eliminado"
                                            : "Activo"}
                                    </span>
                                    <span>Vidas: {stat.lives_remaining}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="grid grid-cols-4 gap-4 text-center">
                                  <div>
                                    <div className="text-2xl font-bold text-green-600">{stat.matches_won}</div>
                                    <div className="text-xs text-gray-500">Ganados</div>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-red-600">{stat.matches_lost}</div>
                                    <div className="text-xs text-gray-500">Perdidos</div>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-blue-600">{stat.win_percentage}%</div>
                                    <div className="text-xs text-gray-500">% Victoria</div>
                                  </div>
                                  <div>
                                    <div
                                      className={`text-2xl font-bold ${
                                        stat.point_differential > 0
                                          ? "text-green-600"
                                          : stat.point_differential < 0
                                            ? "text-red-600"
                                            : "text-gray-600"
                                      }`}
                                    >
                                      {stat.point_differential > 0 ? "+" : ""}
                                      {stat.point_differential}
                                    </div>
                                    <div className="text-xs text-gray-500">Diferencia</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {getStatsByCategory(category).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No hay participantes en esta categoría aún</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Tab: Partidos */}
          <TabsContent value="matches" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Partidos del Torneo</h2>
              <p className="text-gray-600 text-lg">Todos los enfrentamientos del WildBrowl</p>
            </div>

            {/* Próximos Partidos */}
            {upcomingMatches.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2" />
                  Próximos Partidos
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingMatches.map((match) => (
                    <Card key={match.id} className="hover:shadow-lg transition-all border-blue-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Badge className="mb-4 bg-blue-500 text-white">Programado</Badge>
                          <div className="space-y-2">
                            <div className="font-bold text-lg">
                              {match.participant1?.player_name || match.participant1?.alias || "TBD"}
                            </div>
                            <div className="text-lg font-bold text-gray-500">VS</div>
                            <div className="font-bold text-lg">
                              {match.participant2?.player_name || match.participant2?.alias || "TBD"}
                            </div>
                          </div>
                          <div className="mt-4 space-y-1 text-sm text-gray-600">
                            <div>
                              {match.round} - {match.bracket_type}
                            </div>
                            {match.elimination_match && <div className="text-red-600 font-medium">⚠️ Eliminación</div>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Todos los Partidos por Categoría */}
            <Tabs defaultValue="varonil" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="varonil">Varonil</TabsTrigger>
                <TabsTrigger value="femenil">Femenil</TabsTrigger>
                <TabsTrigger value="mixto">Mixto</TabsTrigger>
              </TabsList>

              {["varonil", "femenil", "mixto"].map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="space-y-4">
                    {getMatchesByCategory(category)
                      .sort((a, b) => {
                        // Ordenar por estado (en vivo primero, luego programados, luego finalizados)
                        const statusOrder = {
                          en_vivo: 0,
                          live: 0,
                          programado: 1,
                          scheduled: 1,
                          finalizado: 2,
                          completed: 2,
                        }
                        return (
                          (statusOrder[a.status as keyof typeof statusOrder] || 3) -
                          (statusOrder[b.status as keyof typeof statusOrder] || 3)
                        )
                      })
                      .map((match) => (
                        <Card
                          key={match.id}
                          className={`hover:shadow-lg transition-all ${
                            match.status === "en_vivo" || match.status === "live"
                              ? "border-red-300 bg-red-50"
                              : match.status === "finalizado" || match.status === "completed"
                                ? "border-green-300 bg-green-50"
                                : "border-blue-300 bg-blue-50"
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-lg">
                                    {match.participant1?.player_name || match.participant1?.alias || "TBD"}
                                  </span>
                                  <span className="text-2xl font-bold">{match.participant1_score}</span>
                                </div>
                                <div className="text-center text-gray-500 font-bold">VS</div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-lg">
                                    {match.participant2?.player_name || match.participant2?.alias || "TBD"}
                                  </span>
                                  <span className="text-2xl font-bold">{match.participant2_score}</span>
                                </div>
                              </div>
                              <div className="text-right ml-6">
                                <Badge
                                  variant={
                                    match.status === "en_vivo" || match.status === "live"
                                      ? "destructive"
                                      : match.status === "finalizado" || match.status === "completed"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className={
                                    match.status === "en_vivo" || match.status === "live" ? "animate-pulse" : ""
                                  }
                                >
                                  {match.status === "en_vivo" || match.status === "live"
                                    ? "🔴 EN VIVO"
                                    : match.status === "finalizado" || match.status === "completed"
                                      ? "Finalizado"
                                      : "Programado"}
                                </Badge>
                                <div className="mt-2 text-sm text-gray-600">
                                  <div>{match.round}</div>
                                  <div className="capitalize">{match.bracket_type} Bracket</div>
                                  {match.elimination_match && (
                                    <div className="text-red-600 font-medium text-xs mt-1">⚠️ Eliminación</div>
                                  )}
                                </div>
                                {match.winner && (
                                  <div className="mt-2 text-sm font-medium text-green-600">
                                    Ganador: {match.winner.player_name || match.winner.alias}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {getMatchesByCategory(category).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No hay partidos programados para esta categoría</p>
                        <p className="text-sm mt-2">
                          {getParticipantsByCategory(category).length >= 2
                            ? "Genera el bracket desde la pestaña Resumen"
                            : `Se necesitan al menos 2 participantes (actual: ${getParticipantsByCategory(category).length})`}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">¿Listo para el Desafío?</h2>
            <p className="text-xl text-white/90 mb-8">
              Únete al torneo más emocionante de flag football individual. Demuestra tus habilidades en el campo 1
              contra 1.
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8 border border-white/20">
              <p className="text-white font-semibold">
                💡 <strong>Tip para pruebas:</strong> El sistema funciona con cualquier número de participantes.
              </p>
              <p className="text-white/90 text-sm mt-2">
                Prueba registrando 6-7 jugadores primero, luego experimenta con 16 o 32 para ver la diferencia.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
                onClick={() => setActiveTab("register")}
              >
                <Target className="w-5 h-5 mr-2" />
                Inscribirse por $100
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-orange-600 bg-transparent"
                onClick={() => setActiveTab("bracket")}
              >
                Ver Brackets
                <Flame className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
