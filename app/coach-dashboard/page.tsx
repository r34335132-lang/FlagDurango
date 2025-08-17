"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/Button"
import Trophy from "@/components/icons/Trophy"

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
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    loadData()
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
        const teamCreatedAt = new Date(team.created_at)
        const timeDiffHours = Math.abs(teamCreatedAt.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60)
        const similarityScore = calculateSimilarity(team.captain_name || "", user.username)

        return {
          team_id: team.id,
          team_name: team.name,
          captain_name: team.captain_name || "",
          similarity_score: similarityScore,
          time_difference_hours: timeDiffHours,
          team_created: team.created_at,
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

  const loadData = async () => {
    try {
      const [teamsRes, allTeamsRes, playersRes, gamesRes] = await Promise.all([
        fetch("/api/teams?coach=true"),
        fetch("/api/teams"),
        fetch("/api/players"),
        fetch("/api/games"),
      ])

      const [teamsData, allTeamsData, playersData, gamesData] = await Promise.all([
        teamsRes.json(),
        allTeamsRes.json(),
        playersRes.json(),
        gamesRes.json(),
      ])

      if (teamsData.success) setTeams(teamsData.data || [])
      if (allTeamsData.success) setAllTeams(allTeamsData.data || [])
      if (playersData.success) setPlayers(playersData.data || [])
      if (gamesData.success) setGames(gamesData.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
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

  const createGame = async () => {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameForm),
      })
      const data = await response.json()
      if (data.success) {
        loadData()
        setShowGameForm(false)
        setGameForm({
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
      }
    } catch (error) {
      console.error("Error creating game:", error)
    }
  }

  const createPlayer = async () => {
    if (!teams[0]) return

    try {
      const playerData = {
        ...playerForm,
        team_id: teams[0].id,
        jersey_number: playerForm.jersey_number ? Number.parseInt(playerForm.jersey_number) : null,
      }

      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      })
      const data = await response.json()
      if (data.success) {
        loadData()
        setShowPlayerForm(false)
        setPlayerForm({ name: "", position: "QB", jersey_number: "", photo_url: "" })
      }
    } catch (error) {
      console.error("Error creating player:", error)
    }
  }

  const updatePlayer = async () => {
    if (!editingPlayer) return

    try {
      const playerData = {
        ...playerForm,
        jersey_number: playerForm.jersey_number ? Number.parseInt(playerForm.jersey_number) : null,
      }

      const response = await fetch(`/api/players?id=${editingPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      })
      const data = await response.json()
      if (data.success) {
        loadData()
        setEditingPlayer(null)
        setPlayerForm({ name: "", position: "QB", jersey_number: "", photo_url: "" })
      }
    } catch (error) {
      console.error("Error updating player:", error)
    }
  }

  const deletePlayer = async (playerId: number) => {
    if (!confirm("¿Estás seguro de eliminar este jugador?")) return

    try {
      const response = await fetch(`/api/players?id=${playerId}`, { method: "DELETE" })
      const data = await response.json()
      if (data.success) {
        loadData()
      }
    } catch (error) {
      console.error("Error deleting player:", error)
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

  const createPaymentPreference = async () => {
    if (!teams[0]) return

    try {
      const response = await fetch("/api/payments/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teams[0].id,
          team_name: teams[0].name,
          amount: 1600,
        }),
      })
      const data = await response.json()
      if (data.success && data.init_point) {
        window.open(data.init_point, "_blank")
      }
    } catch (error) {
      console.error("Error creating payment:", error)
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
          amount: 1600, // ✅ CAMBIADO DE 1500 A 1600
        }),
      })

      const data = await response.json()
      console.log("💳 Respuesta MercadoPago:", data)

      if (data.success) {
        // Redirigir en la misma ventana en lugar de popup
        const paymentUrl = data.data.init_point || data.data.sandbox_init_point
        if (paymentUrl) {
          window.location.href = paymentUrl // Cambiar de window.open a window.location.href
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

  const startEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setPlayerForm({
      name: player.name,
      position: player.position,
      jersey_number: player.jersey_number?.toString() || "",
      photo_url: player.photo_url || "",
    })
  }

  const cancelEdit = () => {
    setEditingPlayer(null)
    setPlayerForm({ name: "", position: "QB", jersey_number: "", photo_url: "" })
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

  const myTeamGames = games.filter(
    (game) => teams[0] && (game.home_team === teams[0].name || game.away_team === teams[0].name),
  )

  const myTeamPlayers = players.filter((player) => teams[0] && player.team_id === teams[0].id)

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
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
        <div className="absolute inset-0 bg-black/40"></div>
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

            {/* Botón para volver al dashboard - Responsive */}
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
              {/* Content based on active tab - All responsive */}
              {/* ... resto del contenido con clases responsive ... */}
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
