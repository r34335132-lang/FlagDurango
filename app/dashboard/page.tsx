"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Users,
  Trophy,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react"

interface Team {
  id: number
  name: string
  category: string
  color1: string
  color2: string
  logo_url?: string
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
}

interface Payment {
  id: number
  team_id?: number
  player_id?: number
  referee_id?: number
  payment_type: string
  amount: number
  description: string
  status: string
  due_date: string
  paid_date?: string
  created_at: string
  team?: { name: string }
  player?: { name: string }
  referee?: { name: string }
}

interface Venue {
  id: number
  name: string
  address: string
  city: string
  phone: string
}

interface Field {
  id: number
  name: string
  venue_id: number
  surface_type: string
  capacity: number
}

export default function Dashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: "",
    category: "varonil-gold",
    color1: "#3B82F6",
    color2: "#1E40AF",
    logo_url: "",
  })

  const [gameForm, setGameForm] = useState({
    home_team: "",
    away_team: "",
    game_date: "",
    game_time: "",
    venue: "",
    field: "",
    category: "varonil-gold",
    referee1: "",
    referee2: "",
    status: "programado",
  })

  const [paymentForm, setPaymentForm] = useState({
    team_id: "",
    payment_type: "registration",
    amount: "",
    description: "",
    due_date: "",
  })

  const loadData = async () => {
    try {
      const [teamsRes, gamesRes, paymentsRes, venuesRes, fieldsRes] = await Promise.all([
        fetch("/api/teams").catch(() => ({ json: () => ({ success: false, data: [] }) })),
        fetch("/api/games").catch(() => ({ json: () => ({ success: false, data: [] }) })),
        fetch("/api/payments").catch(() => ({ json: () => ({ success: false, data: [] }) })),
        fetch("/api/venues").catch(() => ({ json: () => ({ success: false, data: [] }) })),
        fetch("/api/fields").catch(() => ({ json: () => ({ success: false, data: [] }) })),
      ])

      const [teamsData, gamesData, paymentsData, venuesData, fieldsData] = await Promise.all([
        teamsRes.json(),
        gamesRes.json(),
        paymentsRes.json(),
        venuesRes.json(),
        fieldsRes.json(),
      ])

      if (teamsData.success) setTeams(teamsData.data)
      if (gamesData.success) setGames(gamesData.data)
      if (paymentsData.success) setPayments(paymentsData.data)
      if (venuesData.success) setVenues(venuesData.data)
      if (fieldsData.success) setFields(fieldsData.data)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStats = async () => {
    setUpdating(true)
    try {
      const response = await fetch("/api/stats/update", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert("Estadísticas actualizadas correctamente")
        loadData() // Recargar datos
      } else {
        alert("Error al actualizar estadísticas")
      }
    } catch (error) {
      console.error("Error updating stats:", error)
      alert("Error al actualizar estadísticas")
    } finally {
      setUpdating(false)
    }
  }

  const createTeam = async () => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      })

      const data = await response.json()

      if (data.success) {
        setTeamForm({
          name: "",
          category: "varonil-gold",
          color1: "#3B82F6",
          color2: "#1E40AF",
          logo_url: "",
        })
        loadData()
        alert("Equipo creado exitosamente")
      } else {
        alert(data.message || "Error al crear equipo")
      }
    } catch (error) {
      console.error("Error creating team:", error)
      alert("Error al crear equipo")
    }
  }

  const deleteTeam = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este equipo?")) return

    try {
      const response = await fetch(`/api/teams?id=${id}`, { method: "DELETE" })
      const data = await response.json()

      if (data.success) {
        loadData()
        alert("Equipo eliminado exitosamente")
      } else {
        alert(data.message || "Error al eliminar equipo")
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("Error al eliminar equipo")
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
        setGameForm({
          home_team: "",
          away_team: "",
          game_date: "",
          game_time: "",
          venue: "",
          field: "",
          category: "varonil-gold",
          referee1: "",
          referee2: "",
          status: "programado",
        })
        loadData()
        alert("Partido creado exitosamente")
      } else {
        alert(data.message || "Error al crear partido")
      }
    } catch (error) {
      console.error("Error creating game:", error)
      alert("Error al crear partido")
    }
  }

  const updateGameStatus = async (id: number, status: string, home_score?: number, away_score?: number) => {
    try {
      const response = await fetch("/api/games", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, home_score, away_score }),
      })

      const data = await response.json()

      if (data.success) {
        loadData()
        setEditingGame(null)
        alert("Partido actualizado exitosamente")
      } else {
        alert(data.message || "Error al actualizar partido")
      }
    } catch (error) {
      console.error("Error updating game:", error)
      alert("Error al actualizar partido")
    }
  }

  const deleteGame = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este partido?")) return

    try {
      const response = await fetch(`/api/games?id=${id}`, { method: "DELETE" })
      const data = await response.json()

      if (data.success) {
        loadData()
        alert("Partido eliminado exitosamente")
      } else {
        alert(data.message || "Error al eliminar partido")
      }
    } catch (error) {
      console.error("Error deleting game:", error)
      alert("Error al eliminar partido")
    }
  }

  const createPayment = async () => {
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          team_id: paymentForm.team_id ? Number.parseInt(paymentForm.team_id) : null,
          amount: Number.parseFloat(paymentForm.amount),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentForm({
          team_id: "",
          payment_type: "registration",
          amount: "",
          description: "",
          due_date: "",
        })
        loadData()
        alert("Pago registrado exitosamente")
      } else {
        alert(data.message || "Error al registrar pago")
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      alert("Error al registrar pago")
    }
  }

  const updatePaymentStatus = async (id: number, status: string) => {
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error("Error updating payment:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500"
      case "overdue":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "overdue":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "programado":
        return "bg-blue-600"
      case "en_vivo":
        return "bg-red-600"
      case "finalizado":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "programado":
        return "Programado"
      case "en_vivo":
        return "En Vivo"
      case "finalizado":
        return "Finalizado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard Admin</h1>
          <div className="flex gap-4">
            <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar
            </Button>
            <Button onClick={updateStats} disabled={updating} className="bg-green-600 hover:bg-green-700">
              <RefreshCw className={`w-4 h-4 mr-2 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Actualizando..." : "Actualizar Estadísticas"}
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              Ver Sitio
            </Button>
          </div>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="teams" className="data-[state=active]:bg-white/20">
              <Users className="w-4 h-4 mr-2" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="games" className="data-[state=active]:bg-white/20">
              <Trophy className="w-4 h-4 mr-2" />
              Partidos
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-white/20">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-white/20">
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <div className="grid gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Nuevo Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Nombre del Equipo</Label>
                      <Input
                        value={teamForm.name}
                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Categoría</Label>
                      <select
                        value={teamForm.category}
                        onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="varonil-gold">Varonil Gold</option>
                        <option value="varonil-silver">Varonil Silver</option>
                        <option value="femenil-gold">Femenil Gold</option>
                        <option value="femenil-silver">Femenil Silver</option>
                        <option value="mixto-gold">Mixto Gold</option>
                        <option value="mixto-silver">Mixto Silver</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Color 1</Label>
                      <Input
                        type="color"
                        value={teamForm.color1}
                        onChange={(e) => setTeamForm({ ...teamForm, color1: e.target.value })}
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Color 2</Label>
                      <Input
                        type="color"
                        value={teamForm.color2}
                        onChange={(e) => setTeamForm({ ...teamForm, color2: e.target.value })}
                        className="bg-white/10 border-white/20"
                      />
                    </div>
                  </div>
                  <Button onClick={createTeam} className="w-full">
                    Crear Equipo
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {teams.map((team) => (
                  <Card key={team.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{
                              background: `linear-gradient(to right, ${team.color1}, ${team.color2})`,
                            }}
                          >
                            {team.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">{team.name}</h3>
                            <Badge>{team.category}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {team.stats && (
                            <div className="text-right text-white mr-4">
                              <div className="font-bold">{team.stats.points} pts</div>
                              <div className="text-sm text-white/70">
                                {team.stats.wins}W-{team.stats.losses}L-{team.stats.draws}D
                              </div>
                            </div>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteTeam(team.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <div className="grid gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Programar Nuevo Partido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Equipo Local</Label>
                      <select
                        value={gameForm.home_team}
                        onChange={(e) => setGameForm({ ...gameForm, home_team: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.name}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Equipo Visitante</Label>
                      <select
                        value={gameForm.away_team}
                        onChange={(e) => setGameForm({ ...gameForm, away_team: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.name}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Fecha</Label>
                      <Input
                        type="date"
                        value={gameForm.game_date}
                        onChange={(e) => setGameForm({ ...gameForm, game_date: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Hora</Label>
                      <Input
                        type="time"
                        value={gameForm.game_time}
                        onChange={(e) => setGameForm({ ...gameForm, game_time: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Sede</Label>
                      <select
                        value={gameForm.venue}
                        onChange={(e) => setGameForm({ ...gameForm, venue: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="">Seleccionar sede</option>
                        {venues.map((venue) => (
                          <option key={venue.id} value={venue.name}>
                            {venue.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Campo</Label>
                      <select
                        value={gameForm.field}
                        onChange={(e) => setGameForm({ ...gameForm, field: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="">Seleccionar campo</option>
                        {fields
                          .filter((field) => {
                            const selectedVenue = venues.find((v) => v.name === gameForm.venue)
                            return selectedVenue ? field.venue_id === selectedVenue.id : true
                          })
                          .map((field) => (
                            <option key={field.id} value={field.name}>
                              {field.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <Button onClick={createGame} className="w-full">
                    Programar Partido
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {games.map((game) => (
                  <Card key={game.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {game.home_team} vs {game.away_team}
                          </h3>
                          <div className="text-white/70 text-sm">
                            {new Date(game.game_date).toLocaleDateString("es-ES")} - {game.game_time}
                          </div>
                          <div className="text-white/70 text-sm">
                            {game.venue} - {game.field}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(game.status)} text-white`}>
                            {getStatusLabel(game.status)}
                          </Badge>
                          {game.status === "finalizado" && (
                            <div className="text-white font-bold text-lg">
                              {game.home_score} - {game.away_score}
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setEditingGame(game)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteGame(game.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Edit Game Modal */}
              {editingGame && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 fixed inset-4 z-50 overflow-auto">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Editar Partido: {editingGame.home_team} vs {editingGame.away_team}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Estado</Label>
                        <select
                          value={editingGame.status}
                          onChange={(e) => setEditingGame({ ...editingGame, status: e.target.value })}
                          className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                        >
                          <option value="programado">Programado</option>
                          <option value="en_vivo">En Vivo</option>
                          <option value="finalizado">Finalizado</option>
                        </select>
                      </div>
                      <div></div>
                      {(editingGame.status === "en_vivo" || editingGame.status === "finalizado") && (
                        <>
                          <div>
                            <Label className="text-white">Marcador {editingGame.home_team}</Label>
                            <Input
                              type="number"
                              value={editingGame.home_score || 0}
                              onChange={(e) =>
                                setEditingGame({ ...editingGame, home_score: Number.parseInt(e.target.value) })
                              }
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Marcador {editingGame.away_team}</Label>
                            <Input
                              type="number"
                              value={editingGame.away_score || 0}
                              onChange={(e) =>
                                setEditingGame({ ...editingGame, away_score: Number.parseInt(e.target.value) })
                              }
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        onClick={() =>
                          updateGameStatus(
                            editingGame.id,
                            editingGame.status,
                            editingGame.home_score,
                            editingGame.away_score,
                          )
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Guardar Cambios
                      </Button>
                      <Button onClick={() => setEditingGame(null)} variant="outline">
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Nuevo Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Equipo</Label>
                      <select
                        value={paymentForm.team_id}
                        onChange={(e) => setPaymentForm({ ...paymentForm, team_id: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="">Seleccionar equipo</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Tipo de Pago</Label>
                      <select
                        value={paymentForm.payment_type}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      >
                        <option value="registration">Registro</option>
                        <option value="arbitration">Arbitraje</option>
                        <option value="fine">Multa</option>
                        <option value="penalty">Penalización</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white">Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Fecha Límite</Label>
                      <Input
                        type="date"
                        value={paymentForm.due_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white">Descripción</Label>
                      <Input
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <Button onClick={createPayment} className="w-full">
                    Registrar Pago
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {payments.map((payment) => (
                  <Card key={payment.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {payment.team?.name || payment.player?.name || payment.referee?.name}
                          </h3>
                          <div className="text-white/70 text-sm">
                            {payment.payment_type} - ${payment.amount}
                          </div>
                          <div className="text-white/70 text-sm">{payment.description}</div>
                          <div className="text-white/70 text-sm">
                            Vence: {new Date(payment.due_date).toLocaleDateString("es-ES")}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getPaymentStatusColor(payment.status)} text-white`}>
                            {getPaymentStatusIcon(payment.status)}
                            <span className="ml-1">
                              {payment.status === "paid"
                                ? "Pagado"
                                : payment.status === "overdue"
                                  ? "Vencido"
                                  : "Pendiente"}
                            </span>
                          </Badge>
                          {payment.status !== "paid" && (
                            <Button
                              size="sm"
                              onClick={() => updatePaymentStatus(payment.id, "paid")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Marcar Pagado
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Calendario de Partidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {games
                    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
                    .map((game) => (
                      <div
                        key={game.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div>
                          <h3 className="text-white font-semibold">
                            {game.home_team} vs {game.away_team}
                          </h3>
                          <div className="text-white/70 text-sm">
                            {new Date(game.game_date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            - {game.game_time}
                          </div>
                          <div className="text-white/70 text-sm">
                            {game.venue} - {game.field}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(game.status)} text-white`}>
                          {getStatusLabel(game.status)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
