"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  RefreshCw,
  LogOut,
  Zap,
  CreditCard,
  Filter,
  ImageIcon,
  Edit,
  Trash2,
} from "lucide-react"

import { toast } from "@/components/ui/use-toast"

interface Team {
  id: number
  name: string
  category: string
  logo_url?: string
  color1: string
  color2: string
  captain_name?: string
  captain_phone?: string
  coach_id?: number
  coach_name?: string
  paid: boolean
  created_at: string
  stats?: {
    games_played: number
    wins: number
    losses: number
    draws: number
    points: number
  }
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
  match_type?: string
  jornada?: number
}

interface Player {
  id: number
  name: string
  jersey_number: number
  position: string
  photo_url?: string
  team_id: number
}

interface CoachUser {
  id: number
  username: string
  email: string
  role: string
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
  const [user, setUser] = useState<CoachUser | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [payingTeam, setPayingTeam] = useState<number | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<any>(null)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [activeTab, setActiveTab] = useState("teams")

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
  })

  const [playerForm, setPlayerForm] = useState({
    name: "",
    jersey_number: "",
    position: "",
    photo_url: "",
    team_id: "",
  })

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
      loadData()
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

  const loadData = async () => {
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
        await loadData() // Recargar datos
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
        await loadData()
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
        await loadData()
        setTeamForm({
          name: "",
          category: "",
          color1: "#3B82F6",
          color2: "#1E40AF",
          logo_url: "",
          captain_name: "",
          captain_phone: "",
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

  const createPlayer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const isEditing = editingPlayer !== null
      const method = isEditing ? "PUT" : "POST"
      const url = "/api/players"

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingPlayer.id }),
          ...playerForm,
          jersey_number: Number.parseInt(playerForm.jersey_number),
          team_id: Number.parseInt(playerForm.team_id),
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadData()
        setPlayerForm({ name: "", jersey_number: "", position: "", photo_url: "", team_id: "" })
        setEditingPlayer(null)
        setShowPlayerForm(false)
        setError(null)
        setSuccess(isEditing ? "Jugador editado exitosamente" : "Jugador agregado exitosamente")
        setActiveTab("players")
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError(
        "Error al " +
          (editingPlayer ? "editar" : "crear") +
          " jugador: " +
          (error instanceof Error ? error.message : "Error desconocido"),
      )
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

        // Mostrar información de debug si está disponible
        if (data.debug) {
          console.error("🐛 Debug info:", data.debug)
        }
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
      teens: "Teens",
    }
    return labels[category] || category
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

  const handleEditPlayer = (player: any) => {
    setEditingPlayer(player)
    setPlayerForm({
      name: player.name,
      jersey_number: player.jersey_number?.toString() || "",
      position: player.position || "",
      team_id: player.team_id?.toString() || "",
      photo_url: player.photo_url || "",
    })
    setShowPlayerForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este jugador?")) {
      return
    }

    try {
      const response = await fetch(`/api/players?id=${playerId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        setPlayers(players.filter((p) => p.id !== playerId))
        toast({
          title: "Éxito",
          description: "Jugador eliminado correctamente",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al eliminar jugador",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting player:", error)
      toast({
        title: "Error",
        description: "Error al eliminar jugador",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">Debes iniciar sesión como coach para acceder al dashboard.</p>
            <Button onClick={() => router.push("/login")}>Iniciar Sesión</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard del Coach</h1>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{user.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadData}
              variant="outline"
              className="text-white border-white/20 bg-transparent hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
            >
              Ver Sitio
            </Button>
            <Button onClick={logout} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Auto-assign section */}
        {potentialMatches.length > 0 && teams.length === 0 && (
          <Card className="mb-8 bg-gradient-to-r from-green-500 to-blue-500 border-0 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-6 h-6" />
                ¡Equipos Detectados Automáticamente!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-white">
                Hemos encontrado <strong>{potentialMatches.length} equipo(s)</strong> que podrían ser tuyos basándose en
                nombres similares y fechas de creación cercanas.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {potentialMatches.slice(0, 4).map((match) => (
                  <div key={match.team_id} className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{match.team_name}</h4>
                        <p className="text-sm opacity-80 text-white">Capitán: {match.captain_name}</p>
                      </div>
                      <Button
                        onClick={() => assignSpecificTeam(match.team_id)}
                        size="sm"
                        className="bg-white text-blue-600 hover:bg-gray-100"
                      >
                        Asignar
                      </Button>
                    </div>
                    <div className="text-xs opacity-70 text-white">
                      Similitud: {match.similarity_score}/5 | Tiempo: {match.time_difference_hours.toFixed(1)}h
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={autoAssignBestMatches}
                  disabled={autoAssigning}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {autoAssigning ? "Asignando..." : "Asignar Mejores Matches Automáticamente"}
                </Button>
                <Button
                  onClick={() => setPotentialMatches([])}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Ignorar Sugerencias
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error/Success Display */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              Cerrar
            </Button>
          </Alert>
        )}

        {success && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)} className="ml-auto">
              Cerrar
            </Button>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white">{teams.length}</h3>
              <p className="text-white/70">Mis Equipos</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white">{getUpcomingGames().length}</h3>
              <p className="text-white/70">Próximos Partidos</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white">{getMyPlayers().length}</h3>
              <p className="text-white/70">Mis Jugadores</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white">{teams.filter((t) => t.paid).length}</h3>
              <p className="text-white/70">Equipos Pagados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="teams" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white"
            >
              Equipos ({teams.length})
            </TabsTrigger>
            <TabsTrigger
              value="games"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white"
            >
              Mis Partidos ({getMyGames().length})
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white"
            >
              Jugadores ({getMyPlayers().length})
            </TabsTrigger>
          </TabsList>

          {/* Equipos Tab */}
          <TabsContent value="teams" className="space-y-6">
            {/* Crear Equipo */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Crear Nuevo Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createTeam} className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Nombre del Equipo (sin sufijo)</Label>
                    <Input
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Ej: Wildcats (se agregará VG automáticamente)"
                      required
                    />
                    <p className="text-white/60 text-xs mt-1">
                      Se agregará automáticamente el sufijo según la categoría (VG, VS, FG, etc.)
                    </p>
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
                      <option value="varonil-gold">Varonil Gold (VG)</option>
                      <option value="varonil-silver">Varonil Silver (VS)</option>
                      <option value="femenil-gold">Femenil Gold (FG)</option>
                      <option value="femenil-silver">Femenil Silver (FS)</option>
                      <option value="femenil-cooper">Femenil Cooper (FC)</option>
                      <option value="mixto-gold">Mixto Gold (MG)</option>
                      <option value="mixto-silver">Mixto Silver (MS)</option>
                      <option value="teens">Teens (T)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-white">Nombre del Capitán</Label>
                    <Input
                      value={teamForm.captain_name}
                      onChange={(e) => setTeamForm({ ...teamForm, captain_name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Nombre del capitán"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Teléfono del Capitán</Label>
                    <Input
                      value={teamForm.captain_phone}
                      onChange={(e) => setTeamForm({ ...teamForm, captain_phone: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="(618) 123-4567"
                    />
                  </div>
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
                  <div className="md:col-span-2">
                    <Label className="text-white">URL del Logo (opcional)</Label>
                    <Input
                      value={teamForm.logo_url}
                      onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Equipo
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Equipos */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          background: `linear-gradient(to right, ${team.color1}, ${team.color2})`,
                        }}
                      >
                        {team.logo_url ? (
                          <img
                            src={team.logo_url || "/placeholder.svg"}
                            alt="Logo"
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = team.name.charAt(0)
                              }
                            }}
                          />
                        ) : (
                          team.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                        <Badge className="bg-blue-600 text-white">{getCategoryLabel(team.category)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {team.captain_name && (
                      <div className="text-white/80 text-sm">
                        <strong>Capitán:</strong> {team.captain_name}
                      </div>
                    )}
                    {team.captain_phone && (
                      <div className="text-white/80 text-sm flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {team.captain_phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={team.paid ? "bg-green-600" : "bg-red-600"}>
                        {team.paid ? "Pagado" : "Pendiente"}
                      </Badge>
                      <Badge variant="outline" className="text-white border-white/20">
                        ID: {team.id}
                      </Badge>
                    </div>
                    {!team.paid && (
                      <Button
                        onClick={() => handlePayment(team)}
                        disabled={payingTeam === team.id}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {payingTeam === team.id ? "Procesando..." : "Pagar Inscripción ($1,600)"}
                      </Button>
                    )}
                    <div className="text-white/60 text-xs">💡 Los $300 de fianza se pagan en efectivo al Staff</div>
                    {team.stats && (
                      <div className="bg-white/5 rounded p-3 text-sm text-white/80">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Partidos: {team.stats.games_played}</div>
                          <div>Puntos: {team.stats.points}</div>
                          <div>Ganados: {team.stats.wins}</div>
                          <div>Perdidos: {team.stats.losses}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {teams.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No tienes equipos asignados</h3>
                  <p className="text-white/70 mb-4">
                    {potentialMatches.length > 0
                      ? "Revisa las sugerencias automáticas arriba o crea un nuevo equipo."
                      : "Crea tu primer equipo usando el formulario de arriba."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Partidos Tab */}
          <TabsContent value="games" className="space-y-6">
            {/* Filtros */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros de Partidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white">Estado</Label>
                    <select
                      value={gameFilter.status}
                      onChange={(e) => setGameFilter({ ...gameFilter, status: e.target.value })}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                    >
                      <option value="all">Todos</option>
                      <option value="programado">Programados</option>
                      <option value="en_vivo">En Vivo</option>
                      <option value="finalizado">Finalizados</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-white">Categoría</Label>
                    <select
                      value={gameFilter.category}
                      onChange={(e) => setGameFilter({ ...gameFilter, category: e.target.value })}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                    >
                      <option value="all">Todas</option>
                      <option value="varonil-gold">Varonil Gold</option>
                      <option value="varonil-silver">Varonil Silver</option>
                      <option value="femenil-gold">Femenil Gold</option>
                      <option value="femenil-silver">Femenil Silver</option>
                      <option value="femenil-cooper">Femenil Cooper</option>
                      <option value="mixto-gold">Mixto Gold</option>
                      <option value="mixto-silver">Mixto Silver</option>
                      <option value="teens">Teens</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-white">Equipo</Label>
                    <select
                      value={gameFilter.team}
                      onChange={(e) => setGameFilter({ ...gameFilter, team: e.target.value })}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                    >
                      <option value="all">Todos mis equipos</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.name}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximos Partidos */}
            {getUpcomingGames().length > 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Próximos Partidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getUpcomingGames().map((game) => (
                      <div key={game.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-semibold">
                            {game.home_team} vs {game.away_team}
                          </h4>
                          <Badge className="bg-blue-600 text-white">{getCategoryLabel(game.category)}</Badge>
                        </div>
                        <div className="text-white/80 text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(game.game_date).toLocaleDateString("es-ES")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {game.game_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {game.venue} - {game.field}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultados Recientes */}
            {getRecentResults().length > 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Resultados Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getRecentResults().map((game) => (
                      <div key={game.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-semibold">
                            {game.home_team} vs {game.away_team}
                          </h4>
                          <Badge className="bg-green-600 text-white">Finalizado</Badge>
                        </div>
                        <div className="text-center mb-2">
                          <div className="text-2xl font-bold text-white">
                            {game.home_score} - {game.away_score}
                          </div>
                        </div>
                        <div className="text-white/80 text-sm text-center">
                          {new Date(game.game_date).toLocaleDateString("es-ES")} - {game.venue}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Todos los Partidos Filtrados */}
            <div className="grid md:grid-cols-2 gap-6">
              {getMyGames().map((game) => (
                <Card key={game.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      {game.home_team} vs {game.away_team}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-blue-600 text-white">{getCategoryLabel(game.category)}</Badge>
                      <Badge
                        className={
                          game.status === "finalizado"
                            ? "bg-green-600 text-white"
                            : game.status === "en_vivo"
                              ? "bg-red-600 text-white"
                              : "bg-yellow-600 text-white"
                        }
                      >
                        {game.status === "en_vivo"
                          ? "En Vivo"
                          : game.status === "finalizado"
                            ? "Finalizado"
                            : "Programado"}
                      </Badge>
                      {game.match_type === "amistoso" && <Badge className="bg-gray-600 text-white">Amistoso</Badge>}
                      {game.jornada && <Badge className="bg-purple-600 text-white">J{game.jornada}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {game.home_score !== null && game.away_score !== null && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">
                          {game.home_score} - {game.away_score}
                        </div>
                      </div>
                    )}
                    <div className="text-white/80 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(game.game_date).toLocaleDateString("es-ES")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {game.game_time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {game.venue} - {game.field}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getMyGames().length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No hay partidos</h3>
                  <p className="text-white/70">
                    {teams.length === 0
                      ? "Primero asigna o crea un equipo para ver sus partidos."
                      : "No hay partidos que coincidan con los filtros seleccionados."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Jugadores Tab */}
          <TabsContent value="players" className="space-y-6">
            {/* Crear Jugador */}
            {teams.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Agregar Nuevo Jugador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createPlayer} className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Nombre del Jugador</Label>
                      <Input
                        value={playerForm.name}
                        onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-white">Número de Jersey</Label>
                      <Input
                        type="number"
                        value={playerForm.jersey_number}
                        onChange={(e) => setPlayerForm({ ...playerForm, jersey_number: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                        min="0"
                        max="99"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-white">Posición</Label>
                      <select
                        value={playerForm.position}
                        onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                        required
                      >
                        <option value="">Seleccionar posición</option>
                        <option value="QB">Quarterback (QB)</option>
                        <option value="RB">Running Back (RB)</option>
                        <option value="WR">Wide Receiver (WR)</option>
                        <option value="TE">Tight End (TE)</option>
                        <option value="RU">Rusher (RU)</option>
                        <option value="LB">Linebacker (LB)</option>
                        <option value="DB">Defensive Back (DB)</option>
                        <option value="CB">Corner Back (CB)</option>
                        <option value="C">Center (C)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Equipo</Label>
                      <select
                        value={playerForm.team_id}
                        onChange={(e) => setPlayerForm({ ...playerForm, team_id: e.target.value })}
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
                    <div className="md:col-span-2">
                      <Label className="text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        URL de la Foto del Jugador (opcional)
                      </Label>
                      <Input
                        value={playerForm.photo_url}
                        onChange={(e) => setPlayerForm({ ...playerForm, photo_url: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="https://ejemplo.com/foto-jugador.jpg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Jugador
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de Jugadores */}
            <div className="space-y-8">
              {teams.map((team) => {
                const teamPlayers = getMyPlayers().filter((player) => player.team_id === team.id)

                if (teamPlayers.length === 0) return null

                return (
                  <div key={team.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{team.name}</h3>
                      <Badge className="bg-blue-600/20 text-blue-200 border-blue-400">
                        {teamPlayers.length} jugador{teamPlayers.length !== 1 ? "es" : ""}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {teamPlayers.map((player) => (
                        <Card key={player.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                          <CardContent className="p-6">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url || "/placeholder.svg"}
                                    alt={player.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = "none"
                                      const parent = target.parentElement
                                      if (parent) {
                                        parent.innerHTML = `<div class="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">#${player.jersey_number}</div>`
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    #{player.jersey_number}
                                  </div>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-white mb-2">{player.name}</h3>
                              <Badge className="bg-blue-600 text-white mb-2">{player.position}</Badge>
                              <p className="text-white/70 text-sm">#{player.jersey_number}</p>

                              <div className="flex justify-center gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-blue-600/20 border-blue-400 text-blue-200 hover:bg-blue-600/40"
                                  onClick={() => handleEditPlayer(player)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-600/20 border-red-400 text-red-200 hover:bg-red-600/40"
                                  onClick={() => handleDeletePlayer(player.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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

            {getMyPlayers().length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No tienes jugadores</h3>
                  <p className="text-white/70">
                    {teams.length === 0
                      ? "Primero asigna o crea un equipo para poder agregar jugadores."
                      : "Agrega jugadores a tus equipos usando el formulario de arriba."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
