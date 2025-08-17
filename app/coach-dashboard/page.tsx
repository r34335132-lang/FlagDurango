"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, Plus, Edit, Trash2, DollarSign, Clock, Target, Star } from "lucide-react"

interface CoachDashboardUser {
  id: number
  email: string
  role: string
  name?: string
  phone?: string
  approved?: boolean
  paid?: boolean
}

interface Team {
  id: number
  name: string
  category: string
  logo_url?: string
  color1: string
  color2: string
  coordinator_name?: string
  coordinator_phone?: string
  captain_photo_url?: string
  captain_name?: string
  captain_phone?: string
  coach_name?: string
  coach_phone?: string
  paid?: boolean
  coach_id?: number
  created_at?: string
}

interface Player {
  id: number
  name: string
  position: string
  photo_url?: string
  jersey_number?: number
  team_id: number
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

interface GameForm {
  home_team: string
  away_team: string
  game_date: string
  game_time: string
  venue: string
  field: string
  category: string
  match_type: string
  jornada?: number
}

interface PlayerForm {
  name: string
  position: string
  jersey_number: string
  photo_url: string
}

interface CoachUser {
  id: number
  username: string
  email: string
  role: string
  created_at?: string
}

interface PotentialMatch {
  team_id: number
  team_name: string
  captain_name: string
  similarity_score: number
  time_difference_hours: number
  team_created: string
}

export default function CoachDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<CoachDashboardUser | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [payingTeam, setPayingTeam] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Filtros para juegos
  const [gameFilter, setGameFilter] = useState({
    status: "all", // all, programado, en_vivo, finalizado
    category: "all",
    team: "all",
  })

  // Estados para formularios
  const [teamForm, setTeamForm] = useState({
    name: "",
    category: "",
    color1: "#3B82F6",
    color2: "#1E40AF",
    logo_url: "",
    captain_name: "",
    captain_phone: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    is_institutional: false,
    coordinator_name: "",
    coordinator_phone: "",
  })

  // Forms
  const [gameForm, setGameForm] = useState<GameForm>({
    home_team: "",
    away_team: "",
    game_date: "",
    game_time: "",
    venue: "Polideportivo Mario Vázquez Raña",
    field: "Campo A",
    category: "",
    match_type: "jornada",
    jornada: 1,
  })

  const [playerForm, setPlayerForm] = useState<PlayerForm>({
    name: "",
    position: "QB",
    jersey_number: "",
    photo_url: "",
  })

  const [playerFormOld, setPlayerFormOld] = useState({
    name: "",
    jersey_number: "",
    position: "",
    photo_url: "",
    team_id: "",
  })

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [showGameForm, setShowGameForm] = useState(false)
  const [showPlayerForm, setShowPlayerForm] = useState(false)

  useEffect(() => {
    // Verificar autenticación
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "coach") {
        router.push("/")
        return
      }
      setUser(parsedUser)
      console.log("👤 Usuario coach logueado:", parsedUser)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
      return
    }
  }, [router])

  useEffect(() => {
    if (user) {
      loadDataOld()
    }
  }, [user])

  const calculateSimilarity = (captainName: string, coachUsername: string): number => {
    if (!captainName || !coachUsername) return 0

    const captain = captainName.toLowerCase().trim()
    const coach = coachUsername.toLowerCase().trim()
    const coachFirstName = coach.split(" ")[0]

    // Puntuación por similitud
    let score = 0

    // Match exacto del primer nombre
    if (captain === coachFirstName) score += 5
    // Captain contiene el primer nombre del coach
    else if (captain.includes(coachFirstName)) score += 3
    // Coach contiene el nombre del captain
    else if (coachFirstName.includes(captain)) score += 3
    // Similitud parcial
    else if (captain.substring(0, 3) === coachFirstName.substring(0, 3)) score += 1

    return score
  }

  const findPotentialMatches = (allTeams: Team[], user: CoachUser): PotentialMatch[] => {
    const teamsWithoutCoach = allTeams.filter((team) => !team.coach_id)
    const userCreatedAt = new Date(user.created_at || Date.now())

    return teamsWithoutCoach
      .map((team) => {
        const teamCreatedAt = new Date(team.created_at || Date.now())
        const timeDiffHours = Math.abs(teamCreatedAt.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60)
        const similarityScore = calculateSimilarity(team.captain_name || "", user.username)

        return {
          team_id: team.id,
          team_name: team.name,
          captain_name: team.captain_name || "",
          similarity_score: similarityScore,
          time_difference_hours: timeDiffHours,
          team_created: team.created_at || "",
        }
      })
      .filter((match) => match.similarity_score > 0 || match.time_difference_hours < 2)
      .sort((a, b) => {
        // Ordenar por score de similitud primero, luego por tiempo
        if (a.similarity_score !== b.similarity_score) {
          return b.similarity_score - a.similarity_score
        }
        return a.time_difference_hours - b.time_difference_hours
      })
  }

  const loadDataOld = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Cargando datos para coach_id:", user.id)

      // Cargar todos los equipos
      const allTeamsRes = await fetch("/api/teams")
      const allTeamsData = await allTeamsRes.json()

      if (allTeamsData.success) {
        setAllTeams(allTeamsData.data || [])
        console.log("📊 Todos los equipos:", allTeamsData.data)

        // Buscar matches potenciales
        const matches = findPotentialMatches(allTeamsData.data || [], user)
        setPotentialMatches(matches)
        console.log("🎯 Matches potenciales:", matches)
      }

      // Cargar equipos del coach específico
      const teamsRes = await fetch(`/api/teams?coach_id=${user.id}`)
      const teamsData = await teamsRes.json()

      console.log("🏈 Respuesta equipos del coach:", teamsData)

      if (teamsData.success) {
        setTeams(teamsData.data || [])
        console.log("✅ Equipos del coach cargados:", teamsData.data?.length || 0)

        if (teamsData.data && teamsData.data.length > 0) {
          // Cargar jugadores de los equipos del coach
          const teamIds = teamsData.data.map((t: Team) => t.id)
          const playersRes = await fetch(`/api/players?team_ids=${teamIds.join(",")}`)
          const playersData = await playersRes.json()

          if (playersData.success) {
            setPlayers(playersData.data || [])
          }
        }
      } else {
        console.error("❌ Error cargando equipos:", teamsData.message)
        setError(teamsData.message)
      }

      // Cargar partidos
      const gamesRes = await fetch("/api/games")
      const gamesData = await gamesRes.json()

      if (gamesData.success) {
        setGames(gamesData.data || [])
      }
    } catch (error) {
      console.error("💥 Error cargando datos:", error)
      setError("Error al cargar datos: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setLoading(false)
    }
  }

  const autoAssignBestMatches = async () => {
    if (potentialMatches.length === 0) return

    setAutoAssigning(true)
    setError(null)
    setSuccess(null)

    try {
      // Asignar los mejores matches (score > 2 y tiempo < 2 horas)
      const bestMatches = potentialMatches.filter(
        (match) => match.similarity_score >= 3 || (match.similarity_score > 0 && match.time_difference_hours < 1),
      )

      if (bestMatches.length === 0) {
        setError("No se encontraron matches automáticos suficientemente confiables")
        return
      }

      console.log("🚀 Asignando automáticamente:", bestMatches)

      const promises = bestMatches.map((match) =>
        fetch("/api/teams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: match.team_id,
            coach_id: user!.id,
            coach_name: user!.username,
          }),
        }),
      )

      const results = await Promise.all(promises)
      const successful = results.filter((res) => res.ok)

      if (successful.length > 0) {
        setSuccess(
          `¡${successful.length} equipo(s) asignado(s) automáticamente! ${bestMatches
            .slice(0, successful.length)
            .map((m) => m.team_name)
            .join(", ")}`,
        )
        await loadDataOld() // Recargar datos
      } else {
        setError("Error al asignar equipos automáticamente")
      }
    } catch (error) {
      setError("Error en la asignación automática")
    } finally {
      setAutoAssigning(false)
    }
  }

  const assignSpecificTeam = async (teamId: number) => {
    try {
      const response = await fetch("/api/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: teamId,
          coach_id: user!.id,
          coach_name: user!.username,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess("Equipo asignado exitosamente")
        await loadDataOld()
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError("Error al asignar equipo")
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      console.log("📝 Creando equipo con datos:", { ...teamForm, coach_id: user.id, coach_name: user.username })

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...teamForm,
          coach_id: user.id,
          coach_name: user.username, // IMPORTANTE: Asegurar que se envíe el coach_name
        }),
      })

      const data = await response.json()
      console.log("📤 Respuesta crear equipo:", data)

      if (data.success) {
        console.log("✅ Equipo creado exitosamente")
        await loadDataOld()
        setTeamForm({
          name: "",
          category: "",
          color1: "#3B82F6",
          color2: "#1E40AF",
          logo_url: "",
          captain_name: "",
          captain_phone: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          is_institutional: false,
          coordinator_name: "",
          coordinator_phone: "",
        })
        setError(null)
        setSuccess("Equipo creado exitosamente")
      } else {
        console.error("❌ Error creando equipo:", data.message)
        setError(data.message)
      }
    } catch (error) {
      console.error("💥 Error en createTeam:", error)
      setError("Error al crear equipo: " + (error instanceof Error ? error.message : "Error desconocido"))
    }
  }

  const createPlayerOld = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...playerFormOld,
          jersey_number: Number.parseInt(playerFormOld.jersey_number),
          team_id: Number.parseInt(playerFormOld.team_id),
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadDataOld()
        setPlayerFormOld({ name: "", jersey_number: "", position: "", photo_url: "", team_id: "" })
        setError(null)
        setSuccess("Jugador agregado exitosamente")
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError("Error al crear jugador: " + (error instanceof Error ? error.message : "Error desconocido"))
    }
  }

  const handlePayment = async (team: Team) => {
    setPayingTeam(team.id)
    setError(null)

    try {
      console.log("💳 Iniciando pago para equipo:", team.name)

      const response = await fetch("/api/payments/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: team.id,
          team_name: team.name,
          user_email: user?.email || "coach@ligaflagdurango.com",
          title: `Inscripción Liga Flag Durango - ${team.name}`,
          amount: 1600,
        }),
      })

      const data = await response.json()
      console.log("💳 Respuesta MercadoPago:", data)

      if (data.success) {
        // Redirigir en la misma ventana en lugar de popup para evitar bloqueos
        const paymentUrl = data.data.init_point || data.data.sandbox_init_point
        if (paymentUrl) {
          window.location.href = paymentUrl
          setSuccess("Redirigiendo a MercadoPago para completar el pago...")
        } else {
          setError("No se pudo obtener la URL de pago")
        }
      } else {
        console.error("❌ Error en MercadoPago:", data)
        setError(`Error al crear el pago: ${data.message}`)
      }
    } catch (error) {
      console.error("💥 Error en pago:", error)
      setError("Error al procesar el pago: " + (error instanceof Error ? error.message : "Error de conexión"))
    } finally {
      setPayingTeam(null)
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    router.push("/login")
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

  const getPositionLabel = (position: string) => {
    const positions: { [key: string]: string } = {
      QB: "Quarterback",
      RB: "Running Back",
      WR: "Wide Receiver",
      TE: "Tight End",
      C: "Center",
      LB: "Linebacker",
      DB: "Defensive Back",
      S: "Safety",
      RU: "Rush",
      CB: "Corner Back",
    }
    return positions[position] || position
  }

  const getMyGames = () => {
    const myTeamNames = teams.map((t) => t.name)
    let filteredGames = games.filter((g) => myTeamNames.includes(g.home_team) || myTeamNames.includes(g.away_team))

    // Aplicar filtros
    if (gameFilter.status !== "all") {
      filteredGames = filteredGames.filter((g) => g.status === gameFilter.status)
    }
    if (gameFilter.category !== "all") {
      filteredGames = filteredGames.filter((g) => g.category === gameFilter.category)
    }
    if (gameFilter.team !== "all") {
      filteredGames = filteredGames.filter((g) => g.home_team === gameFilter.team || g.away_team === gameFilter.team)
    }

    return filteredGames
  }

  const getUpcomingGames = () => {
    const myTeamNames = teams.map((t) => t.name)
    return games
      .filter((g) => myTeamNames.includes(g.home_team) || myTeamNames.includes(g.away_team))
      .filter((g) => g.status === "programado")
      .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
      .slice(0, 5)
  }

  const getRecentResults = () => {
    const myTeamNames = teams.map((t) => t.name)
    return games
      .filter((g) => myTeamNames.includes(g.home_team) || myTeamNames.includes(g.away_team))
      .filter((g) => g.status === "finalizado")
      .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
      .slice(0, 5)
  }

  const getMyPlayers = () => {
    const myTeamIds = teams.map((t) => t.id)
    return players.filter((p) => myTeamIds.includes(p.team_id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Cargando dashboard...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Acceso no autorizado</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Hero Section - Responsive */}
      <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
        {/* ✅ REMOVIDO: <div className="absolute inset-0 bg-black/40"></div> */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-green-400/95 backdrop-blur-sm text-gray-900 px-4 md:px-6 py-2 rounded-full font-bold mb-4 md:mb-6 text-sm md:text-base">
              {"🏈 Dashboard Coach - Liga Flag Durango"}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
              Dashboard
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Coach
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 leading-relaxed px-4">
              Bienvenido, <span className="text-yellow-300 font-semibold">{user.name || user.email}</span>
              <span className="block mt-2">Gestiona tu equipo y jugadores desde aquí.</span>
            </p>

            {/* Botones de navegación - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-sm md:text-base"
                onClick={() => (window.location.href = "/coach-dashboard")}
              >
                <Trophy className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Mi Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent text-sm md:text-base"
                onClick={() => (window.location.href = "/")}
              >
                Ir al Inicio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient separator */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500" />

      {/* Main Content - Responsive Grid */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Sidebar - Responsive */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Panel de Control</h2>

              {/* Navigation - Stack on mobile */}
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                    activeTab === "overview"
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  📊 Resumen General
                </button>
                <button
                  onClick={() => setActiveTab("teams")}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                    activeTab === "teams"
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  🏈 Mis Equipos ({teams.length})
                </button>
                <button
                  onClick={() => setActiveTab("players")}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                    activeTab === "players"
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  👥 Jugadores ({getMyPlayers().length})
                </button>
                <button
                  onClick={() => setActiveTab("games")}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                    activeTab === "games"
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  🎯 Partidos ({getMyGames().length})
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                    activeTab === "create"
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  ➕ Crear Equipo
                </button>
              </div>

              {/* User Info - Responsive */}
              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/20">
                <div className="text-white/70 text-xs md:text-sm">
                  <p className="break-all">👤 {user.email}</p>
                  <p>🎖️ Coach</p>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="mt-3 md:mt-4 w-full border-white/30 text-white hover:bg-white hover:text-gray-900 text-xs md:text-sm bg-transparent"
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area - Responsive */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20 min-h-[400px] md:min-h-[600px]">
              {/* Mensajes de estado */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
                  {success}
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Resumen General</h2>

                  {/* Stats Cards - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-4 text-center">
                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-white">{teams.length}</h3>
                        <p className="text-white/70 text-sm">Equipos</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-white">{getMyPlayers().length}</h3>
                        <p className="text-white/70 text-sm">Jugadores</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-4 text-center">
                        <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-white">{getMyGames().length}</h3>
                        <p className="text-white/70 text-sm">Partidos</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions - Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-white/5 border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Próximos Partidos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {getUpcomingGames().length > 0 ? (
                          <div className="space-y-2">
                            {getUpcomingGames()
                              .slice(0, 3)
                              .map((game) => (
                                <div key={game.id} className="text-sm text-white/80 p-2 bg-white/5 rounded">
                                  <div className="font-medium">
                                    {game.home_team} vs {game.away_team}
                                  </div>
                                  <div className="text-white/60">
                                    {game.game_date} - {game.game_time}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-white/60 text-sm">No hay partidos programados</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Resultados Recientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {getRecentResults().length > 0 ? (
                          <div className="space-y-2">
                            {getRecentResults()
                              .slice(0, 3)
                              .map((game) => (
                                <div key={game.id} className="text-sm text-white/80 p-2 bg-white/5 rounded">
                                  <div className="font-medium">
                                    {game.home_team} vs {game.away_team}
                                  </div>
                                  <div className="text-white/60">
                                    {game.home_score} - {game.away_score}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-white/60 text-sm">No hay resultados recientes</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Teams Tab */}
              {activeTab === "teams" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Mis Equipos</h2>
                    <Button
                      onClick={() => setActiveTab("create")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Equipo
                    </Button>
                  </div>

                  {teams.length === 0 ? (
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-8 text-center">
                        <Trophy className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No tienes equipos</h3>
                        <p className="text-white/60 mb-4">Crea tu primer equipo para comenzar</p>
                        <Button onClick={() => setActiveTab("create")} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Equipo
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {teams.map((team) => (
                        <Card key={team.id} className="bg-white/5 border-white/20">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                                <p className="text-white/60 text-sm">{getCategoryLabel(team.category)}</p>
                              </div>
                              <Badge className={team.paid ? "bg-green-600" : "bg-yellow-600"}>
                                {team.paid ? "Pagado" : "Pendiente"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm text-white/80">
                              <div>
                                <span className="text-white/60">Capitán:</span> {team.captain_name || "No asignado"}
                              </div>
                              <div>
                                <span className="text-white/60">Teléfono:</span> {team.captain_phone || "No asignado"}
                              </div>
                              <div className="flex items-center gap-2 mt-4">
                                <div
                                  className="w-4 h-4 rounded-full border border-white/30"
                                  style={{ backgroundColor: team.color1 }}
                                ></div>
                                <div
                                  className="w-4 h-4 rounded-full border border-white/30"
                                  style={{ backgroundColor: team.color2 }}
                                ></div>
                                <span className="text-white/60 text-xs">Colores del equipo</span>
                              </div>
                            </div>

                            {!team.paid && (
                              <div className="mt-4">
                                <Button
                                  onClick={() => handlePayment(team)}
                                  disabled={payingTeam === team.id}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  {payingTeam === team.id ? (
                                    <>
                                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                                      Procesando...
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      Pagar Inscripción ($1,600)
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Equipos disponibles para asignar */}
                  {potentialMatches.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-white mb-4">Equipos Disponibles para Asignar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {potentialMatches.slice(0, 4).map((match) => (
                          <Card key={match.team_id} className="bg-white/5 border-white/20">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-white">{match.team_name}</h4>
                                <Badge className="bg-blue-600 text-xs">Score: {match.similarity_score}</Badge>
                              </div>
                              <p className="text-white/60 text-sm mb-3">Capitán: {match.captain_name}</p>
                              <Button
                                onClick={() => assignSpecificTeam(match.team_id)}
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                Asignar a mi cuenta
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {potentialMatches.length > 0 && (
                        <div className="mt-4 text-center">
                          <Button
                            onClick={autoAssignBestMatches}
                            disabled={autoAssigning}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {autoAssigning ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Asignando...
                              </>
                            ) : (
                              <>
                                <Target className="w-4 h-4 mr-2" />
                                Auto-asignar Mejores Matches
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Players Tab */}
              {activeTab === "players" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Mis Jugadores</h2>
                    {teams.length > 0 && (
                      <Button
                        onClick={() => setActiveTab("add-player")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Jugador
                      </Button>
                    )}
                  </div>

                  {getMyPlayers().length === 0 ? (
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-8 text-center">
                        <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No tienes jugadores</h3>
                        <p className="text-white/60 mb-4">
                          {teams.length === 0
                            ? "Primero crea un equipo para agregar jugadores"
                            : "Agrega jugadores a tu equipo"}
                        </p>
                        {teams.length > 0 && (
                          <Button onClick={() => setActiveTab("add-player")} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Jugador
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getMyPlayers().map((player) => {
                        const team = teams.find((t) => t.id === player.team_id)
                        return (
                          <Card key={player.id} className="bg-white/5 border-white/20">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-white">{player.name}</h4>
                                  <p className="text-white/60 text-sm">{getPositionLabel(player.position)}</p>
                                </div>
                                {player.jersey_number && <Badge className="bg-blue-600">#{player.jersey_number}</Badge>}
                              </div>
                              <p className="text-white/60 text-xs mb-3">Equipo: {team?.name || "Sin equipo"}</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-white/30 text-white hover:bg-white hover:text-gray-900 bg-transparent"
                                  onClick={() => {
                                    // Edit player functionality would go here
                                    console.log("Edit player:", player.id)
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white bg-transparent"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar a ${player.name}?`)) {
                                      // Delete player functionality would go here
                                      console.log("Delete player:", player.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Games Tab */}
              {activeTab === "games" && (
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Mis Partidos</h2>

                  {getMyGames().length === 0 ? (
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-8 text-center">
                        <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No tienes partidos</h3>
                        <p className="text-white/60">Los partidos aparecerán aquí cuando sean programados</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {getMyGames().map((game) => (
                        <Card key={game.id} className="bg-white/5 border-white/20">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h4 className="font-semibold text-white text-lg">
                                  {game.home_team} vs {game.away_team}
                                </h4>
                                <p className="text-white/60 text-sm">
                                  {getCategoryLabel(game.category)} • {game.game_date} • {game.game_time}
                                </p>
                                <p className="text-white/60 text-sm">
                                  {game.venue} - {game.field}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge
                                  className={
                                    game.status === "finalizado"
                                      ? "bg-gray-600"
                                      : game.status === "en_vivo"
                                        ? "bg-red-600"
                                        : "bg-blue-600"
                                  }
                                >
                                  {game.status === "finalizado"
                                    ? "Finalizado"
                                    : game.status === "en_vivo"
                                      ? "En Vivo"
                                      : "Programado"}
                                </Badge>
                                {game.status === "finalizado" && (
                                  <div className="text-white font-bold">
                                    {game.home_score} - {game.away_score}
                                  </div>
                                )}
                                {game.mvp && (
                                  <div className="flex items-center text-yellow-400 text-sm">
                                    <Star className="w-3 h-3 mr-1" />
                                    MVP: {game.mvp}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Create Team Tab */}
              {activeTab === "create" && (
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Crear Nuevo Equipo</h2>

                  <Card className="bg-white/5 border-white/20">
                    <CardContent className="p-6">
                      <form onSubmit={createTeam} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Nombre del Equipo</Label>
                            <Input
                              value={teamForm.name}
                              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                              placeholder="Nombre del equipo"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-white">Categoría</Label>
                            <select
                              value={teamForm.category}
                              onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value })}
                              className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                              required
                            >
                              <option value="">Seleccionar categoría</option>
                              <option value="varonil-gold">Varonil Gold</option>
                              <option value="varonil-silver">Varonil Silver</option>
                              <option value="femenil-gold">Femenil Gold</option>
                              <option value="femenil-silver">Femenil Silver</option>
                              <option value="femenil-cooper">Femenil Cooper</option>
                              <option value="mixto-gold">Mixto Gold</option>
                              <option value="mixto-silver">Mixto Silver</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Nombre del Capitán</Label>
                            <Input
                              value={teamForm.captain_name}
                              onChange={(e) => setTeamForm({ ...teamForm, captain_name: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                              placeholder="Nombre completo del capitán"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-white">Teléfono del Capitán</Label>
                            <Input
                              value={teamForm.captain_phone}
                              onChange={(e) => setTeamForm({ ...teamForm, captain_phone: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                              placeholder="Número de teléfono"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Color Primario</Label>
                            <Input
                              type="color"
                              value={teamForm.color1}
                              onChange={(e) => setTeamForm({ ...teamForm, color1: e.target.value })}
                              className="bg-white/10 border-white/20 h-10"
                            />
                          </div>

                          <div>
                            <Label className="text-white">Color Secundario</Label>
                            <Input
                              type="color"
                              value={teamForm.color2}
                              onChange={(e) => setTeamForm({ ...teamForm, color2: e.target.value })}
                              className="bg-white/10 border-white/20 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">URL del Logo (opcional)</Label>
                          <Input
                            value={teamForm.logo_url}
                            onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                            placeholder="https://ejemplo.com/logo.png"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Equipo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab("overview")}
                            className="border-white/30 text-white hover:bg-white hover:text-gray-900"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Add Player Tab */}
              {activeTab === "add-player" && (
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Agregar Jugador</h2>

                  <Card className="bg-white/5 border-white/20">
                    <CardContent className="p-6">
                      <form onSubmit={createPlayerOld} className="space-y-4">
                        <div>
                          <Label className="text-white">Equipo</Label>
                          <select
                            value={playerFormOld.team_id}
                            onChange={(e) => setPlayerFormOld({ ...playerFormOld, team_id: e.target.value })}
                            className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                            required
                          >
                            <option value="">Seleccionar equipo</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Nombre del Jugador</Label>
                            <Input
                              value={playerFormOld.name}
                              onChange={(e) => setPlayerFormOld({ ...playerFormOld, name: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                              placeholder="Nombre completo"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-white">Número de Jersey</Label>
                            <Input
                              type="number"
                              value={playerFormOld.jersey_number}
                              onChange={(e) => setPlayerFormOld({ ...playerFormOld, jersey_number: e.target.value })}
                              className="bg-white/10 border-white/20 text-white placeholder-white/50"
                              placeholder="Número"
                              min="1"
                              max="99"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">Posición</Label>
                          <select
                            value={playerFormOld.position}
                            onChange={(e) => setPlayerFormOld({ ...playerFormOld, position: e.target.value })}
                            className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                            required
                          >
                            <option value="">Seleccionar posición</option>
                            <option value="QB">Quarterback (QB)</option>
                            <option value="RB">Running Back (RB)</option>
                            <option value="WR">Wide Receiver (WR)</option>
                            <option value="TE">Tight End (TE)</option>
                            <option value="C">Center (C)</option>
                            <option value="LB">Linebacker (LB)</option>
                            <option value="DB">Defensive Back (DB)</option>
                            <option value="S">Safety (S)</option>
                            <option value="RU">Rush (RU)</option>
                            <option value="CB">Corner Back (CB)</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-white">URL de Foto (opcional)</Label>
                          <Input
                            value={playerFormOld.photo_url}
                            onChange={(e) => setPlayerFormOld({ ...playerFormOld, photo_url: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                            placeholder="https://ejemplo.com/foto.jpg"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Jugador
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab("players")}
                            className="border-white/30 text-white hover:bg-white hover:text-gray-900"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA - Responsive */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¿Necesitas ayuda?</h2>
          <p className="text-white/90 text-base md:text-lg mb-6 md:mb-8 px-4">
            Contacta al administrador si tienes dudas sobre tu equipo o jugadores
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-sm md:text-base"
              onClick={() => (window.location.href = "/")}
            >
              <Trophy className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Ir al Inicio
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent text-sm md:text-base"
              onClick={() => (window.location.href = "/partidos")}
            >
              Ver Partidos
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
