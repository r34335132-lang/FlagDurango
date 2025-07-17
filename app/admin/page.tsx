"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, RefreshCw, Eye, EyeOff, Home } from "lucide-react"
import Link from "next/link"

interface Team {
  id: number
  name: string
  category: string
  captain_name: string
  contact_name?: string
  contact_phone: string
  contact_email: string
  logo_url?: string
  color1: string
  color2: string
  created_at: string
}

interface Player {
  id: number
  name: string
  jersey_number: number
  position: string
  team_id: number
  team?: { name: string }
  created_at: string
}

interface Staff {
  id: number
  name: string
  role: string
  phone?: string
  email?: string
  can_edit_games: boolean
  can_edit_scores: boolean
  can_manage_payments: boolean
  user?: { username: string; email: string; status: string }
  created_at: string
}

interface Referee {
  id: number
  name: string
  phone?: string
  email?: string
  license_number?: string
  certification_level: string
  experience_level?: string
  hourly_rate: number
  status?: string
  user?: { username: string; email: string; status: string }
  created_at: string
}

interface Payment {
  id: number
  type: string
  amount: number
  description: string
  team_id?: number
  referee_id?: number
  player_id?: number
  status: string
  due_date: string
  paid_date?: string
  team?: { name: string }
  referee?: { name: string }
  player?: { name: string }
  created_at: string
}

interface Game {
  id: number
  home_team: string
  away_team: string
  game_date: string
  game_time: string
  venue: string
  field: string
  category: string
  referee1?: string
  referee2?: string
  status: string
  home_score?: number
  away_score?: number
  created_at: string
}

interface NewsArticle {
  id: number
  title: string
  content: string
  author: string
  image_url?: string
  created_at: string
}

interface Venue {
  id: number
  name: string
  address: string
  created_at: string
}

interface Field {
  id: number
  name: string
  venue_id: number
  capacity: number
  venue?: { name: string }
  created_at: string
}

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [referees, setReferees] = useState<Referee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("teams")

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: "",
    category: "varonil-gold",
    captain_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    logo_url: "",
    color1: "#3B82F6",
    color2: "#1E40AF",
  })

  const [playerForm, setPlayerForm] = useState({
    name: "",
    jersey_number: "",
    position: "",
    team_id: "",
  })

  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "staff",
    phone: "",
    email: "",
    password: "",
    can_edit_games: false,
    can_edit_scores: false,
    can_manage_payments: false,
  })

  const [refereeForm, setRefereeForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    license_number: "",
    certification_level: "junior",
    hourly_rate: "",
  })

  const [paymentForm, setPaymentForm] = useState({
    type: "team_registration",
    amount: "",
    description: "",
    team_id: "",
    referee_id: "",
    player_id: "",
    status: "pending",
    due_date: "",
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
    home_score: "",
    away_score: "",
  })

  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    author: "Admin Liga",
    image_url: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    staff: false,
    referee: false,
  })

  const [editingGame, setEditingGame] = useState<Game | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [teamsRes, playersRes, staffRes, refereesRes, paymentsRes, gamesRes, newsRes, venuesRes, fieldsRes] =
        await Promise.all([
          fetch("/api/teams"),
          fetch("/api/players"),
          fetch("/api/staff"),
          fetch("/api/referees"),
          fetch("/api/payments"),
          fetch("/api/games"),
          fetch("/api/news"),
          fetch("/api/venues"),
          fetch("/api/fields"),
        ])

      const [
        teamsData,
        playersData,
        staffData,
        refereesData,
        paymentsData,
        gamesData,
        newsData,
        venuesData,
        fieldsData,
      ] = await Promise.all([
        teamsRes.json(),
        playersRes.json(),
        staffRes.json(),
        refereesRes.json(),
        paymentsRes.json(),
        gamesRes.json(),
        newsRes.json(),
        venuesRes.json(),
        fieldsRes.json(),
      ])

      if (teamsData.success) setTeams(teamsData.data || [])
      if (playersData.success) setPlayers(playersData.data || [])
      if (staffData.success) setStaff(staffData.data || [])
      if (refereesData.success) setReferees(refereesData.data || [])
      if (paymentsData.success) setPayments(paymentsData.data || [])
      if (gamesData.success) setGames(gamesData.data || [])
      if (newsData.success) setNews(newsData.data || [])
      if (venuesData.success) setVenues(venuesData.data || [])
      if (fieldsData.success) setFields(fieldsData.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      })

      const data = await response.json()
      if (data.success) {
        setTeams([data.data, ...teams])
        setTeamForm({
          name: "",
          category: "varonil-gold",
          captain_name: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          logo_url: "",
          color1: "#3B82F6",
          color2: "#1E40AF",
        })
        alert("Equipo creado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating team:", error)
      alert("Error al crear equipo")
    }
  }

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...playerForm,
          jersey_number: Number.parseInt(playerForm.jersey_number),
          team_id: Number.parseInt(playerForm.team_id),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPlayers([data.data, ...players])
        setPlayerForm({ name: "", jersey_number: "", position: "", team_id: "" })
        alert("Jugador creado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating player:", error)
      alert("Error al crear jugador")
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      })

      const data = await response.json()
      if (data.success) {
        setStaff([data.data, ...staff])
        setStaffForm({
          name: "",
          role: "staff",
          phone: "",
          email: "",
          password: "",
          can_edit_games: false,
          can_edit_scores: false,
          can_manage_payments: false,
        })
        if (data.createdUser) {
          alert(
            `Staff creado exitosamente!\nUsuario: ${data.createdUser.username}\nContraseña: ${data.createdUser.password}`,
          )
        } else {
          alert("Staff creado exitosamente")
        }
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating staff:", error)
      alert("Error al crear staff")
    }
  }

  const handleCreateReferee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/referees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...refereeForm,
          hourly_rate: Number.parseFloat(refereeForm.hourly_rate) || 0,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setReferees([data.data, ...referees])
        setRefereeForm({
          name: "",
          phone: "",
          email: "",
          password: "",
          license_number: "",
          certification_level: "junior",
          hourly_rate: "",
        })
        if (data.createdUser) {
          alert(
            `Árbitro creado exitosamente!\nUsuario: ${data.createdUser.username}\nContraseña: ${data.createdUser.password}`,
          )
        } else {
          alert("Árbitro creado exitosamente")
        }
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating referee:", error)
      alert("Error al crear árbitro")
    }
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          amount: Number.parseFloat(paymentForm.amount),
          team_id: paymentForm.team_id ? Number.parseInt(paymentForm.team_id) : null,
          referee_id: paymentForm.referee_id ? Number.parseInt(paymentForm.referee_id) : null,
          player_id: paymentForm.player_id ? Number.parseInt(paymentForm.player_id) : null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPayments([data.data, ...payments])
        setPaymentForm({
          type: "team_registration",
          amount: "",
          description: "",
          team_id: "",
          referee_id: "",
          player_id: "",
          status: "pending",
          due_date: "",
        })
        alert("Pago creado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      alert("Error al crear pago")
    }
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameForm),
      })

      const data = await response.json()
      if (data.success) {
        setGames([data.data, ...games])
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
          home_score: "",
          away_score: "",
        })
        alert("Partido creado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating game:", error)
      alert("Error al crear partido")
    }
  }

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsForm),
      })

      const data = await response.json()
      if (data.success) {
        setNews([data.data, ...news])
        setNewsForm({
          title: "",
          content: "",
          author: "Admin Liga",
          image_url: "",
        })
        alert("Noticia creada exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating news:", error)
      alert("Error al crear noticia")
    }
  }

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGame) return

    try {
      const response = await fetch("/api/games", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGame.id,
          status: gameForm.status,
          home_score: gameForm.home_score ? Number.parseInt(gameForm.home_score) : null,
          away_score: gameForm.away_score ? Number.parseInt(gameForm.away_score) : null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGames(games.map((game) => (game.id === editingGame.id ? data.data : game)))
        setEditingGame(null)
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
          home_score: "",
          away_score: "",
        })
        alert("Partido actualizado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error updating game:", error)
      alert("Error al actualizar partido")
    }
  }

  const handleDelete = async (type: string, id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este elemento?")) return

    try {
      const response = await fetch(`/api/${type}?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        // Update local state instead of refetching
        switch (type) {
          case "teams":
            setTeams(teams.filter((item) => item.id !== id))
            break
          case "players":
            setPlayers(players.filter((item) => item.id !== id))
            break
          case "staff":
            setStaff(staff.filter((item) => item.id !== id))
            break
          case "referees":
            setReferees(referees.filter((item) => item.id !== id))
            break
          case "payments":
            setPayments(payments.filter((item) => item.id !== id))
            break
          case "games":
            setGames(games.filter((item) => item.id !== id))
            break
          case "news":
            setNews(news.filter((item) => item.id !== id))
            break
        }
        alert("Elemento eliminado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error deleting:", error)
      alert("Error al eliminar")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      programado: { color: "bg-blue-500", text: "Programado" },
      "en vivo": { color: "bg-red-500", text: "En Vivo" },
      finalizado: { color: "bg-green-500", text: "Finalizado" },
      pending: { color: "bg-yellow-500", text: "Pendiente" },
      paid: { color: "bg-green-500", text: "Pagado" },
      overdue: { color: "bg-red-500", text: "Vencido" },
      active: { color: "bg-green-500", text: "Activo" },
      inactive: { color: "bg-gray-500", text: "Inactivo" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-500",
      text: status,
    }

    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <div className="flex space-x-2">
            <Link href="/">
              <Button variant="outline" className="bg-white/20 text-white border-white/30">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            </Link>
            <Button onClick={fetchData} variant="outline" className="bg-white/20 text-white border-white/30">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 bg-white/20">
            <TabsTrigger
              value="teams"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Equipos
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Jugadores
            </TabsTrigger>
            <TabsTrigger
              value="games"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Partidos
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Staff
            </TabsTrigger>
            <TabsTrigger
              value="referees"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Árbitros
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Pagos
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Noticias
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Crear Equipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                      <Label htmlFor="team-name">Nombre del Equipo</Label>
                      <Input
                        id="team-name"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="team-category">Categoría</Label>
                      <select
                        id="team-category"
                        value={teamForm.category}
                        onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
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
                      <Label htmlFor="captain-name">Nombre del Capitán</Label>
                      <Input
                        id="captain-name"
                        value={teamForm.captain_name}
                        onChange={(e) => setTeamForm({ ...teamForm, captain_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-name">Nombre de Contacto</Label>
                      <Input
                        id="contact-name"
                        value={teamForm.contact_name}
                        onChange={(e) => setTeamForm({ ...teamForm, contact_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone">Teléfono de Contacto</Label>
                      <Input
                        id="contact-phone"
                        value={teamForm.contact_phone}
                        onChange={(e) => setTeamForm({ ...teamForm, contact_phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email">Email de Contacto</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={teamForm.contact_email}
                        onChange={(e) => setTeamForm({ ...teamForm, contact_email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="logo-url">URL del Logo</Label>
                      <Input
                        id="logo-url"
                        value={teamForm.logo_url}
                        onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="color1">Color Primario</Label>
                        <Input
                          id="color1"
                          type="color"
                          value={teamForm.color1}
                          onChange={(e) => setTeamForm({ ...teamForm, color1: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color2">Color Secundario</Label>
                        <Input
                          id="color2"
                          type="color"
                          value={teamForm.color2}
                          onChange={(e) => setTeamForm({ ...teamForm, color2: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Crear Equipo
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Equipos Registrados ({teams.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{
                              background: `linear-gradient(45deg, ${team.color1}, ${team.color2})`,
                            }}
                          >
                            {team.logo_url ? (
                              <img
                                src={team.logo_url || "/placeholder.svg"}
                                alt={team.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              team.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{team.name}</div>
                            <div className="text-sm text-gray-600">
                              {team.category} • Capitán: {team.captain_name}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete("teams", team.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Agregar Jugador</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePlayer} className="space-y-4">
                    <div>
                      <Label htmlFor="player-name">Nombre del Jugador</Label>
                      <Input
                        id="player-name"
                        value={playerForm.name}
                        onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="jersey-number">Número de Jersey</Label>
                      <Input
                        id="jersey-number"
                        type="number"
                        value={playerForm.jersey_number}
                        onChange={(e) => setPlayerForm({ ...playerForm, jersey_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Posición</Label>
                      <Input
                        id="position"
                        value={playerForm.position}
                        onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="team">Equipo</Label>
                      <select
                        id="team"
                        value={playerForm.team_id}
                        onChange={(e) => setPlayerForm({ ...playerForm, team_id: e.target.value })}
                        className="w-full p-2 border rounded"
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
                    <Button type="submit" className="w-full">
                      Agregar Jugador
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Jugadores Registrados ({players.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-semibold">
                            #{player.jersey_number} {player.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {player.position} • {player.team?.name}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete("players", player.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>{editingGame ? "Editar Partido" : "Crear Partido"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={editingGame ? handleUpdateGame : handleCreateGame} className="space-y-4">
                    {!editingGame && (
                      <>
                        <div>
                          <Label htmlFor="home-team">Equipo Local</Label>
                          <select
                            id="home-team"
                            value={gameForm.home_team}
                            onChange={(e) => setGameForm({ ...gameForm, home_team: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                          >
                            <option value="">Seleccionar equipo local</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.name}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="away-team">Equipo Visitante</Label>
                          <select
                            id="away-team"
                            value={gameForm.away_team}
                            onChange={(e) => setGameForm({ ...gameForm, away_team: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                          >
                            <option value="">Seleccionar equipo visitante</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.name}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="game-date">Fecha</Label>
                          <Input
                            id="game-date"
                            type="date"
                            value={gameForm.game_date}
                            onChange={(e) => setGameForm({ ...gameForm, game_date: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="game-time">Hora</Label>
                          <Input
                            id="game-time"
                            type="time"
                            value={gameForm.game_time}
                            onChange={(e) => setGameForm({ ...gameForm, game_time: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue">Sede</Label>
                          <Input
                            id="venue"
                            value={gameForm.venue}
                            onChange={(e) => setGameForm({ ...gameForm, venue: e.target.value })}
                            placeholder="Nombre de la sede"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="field">Campo</Label>
                          <Input
                            id="field"
                            value={gameForm.field}
                            onChange={(e) => setGameForm({ ...gameForm, field: e.target.value })}
                            placeholder="Nombre del campo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Categoría</Label>
                          <select
                            id="category"
                            value={gameForm.category}
                            onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
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
                          <Label htmlFor="referee1">Árbitro Principal</Label>
                          <select
                            id="referee1"
                            value={gameForm.referee1}
                            onChange={(e) => setGameForm({ ...gameForm, referee1: e.target.value })}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Sin árbitro</option>
                            {referees.map((referee) => (
                              <option key={referee.id} value={referee.name}>
                                {referee.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="referee2">Árbitro Asistente</Label>
                          <select
                            id="referee2"
                            value={gameForm.referee2}
                            onChange={(e) => setGameForm({ ...gameForm, referee2: e.target.value })}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Sin árbitro</option>
                            {referees.map((referee) => (
                              <option key={referee.id} value={referee.name}>
                                {referee.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="game-status">Estado</Label>
                      <select
                        id="game-status"
                        value={gameForm.status}
                        onChange={(e) => setGameForm({ ...gameForm, status: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="programado">Programado</option>
                        <option value="en vivo">En Vivo</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>

                    {(gameForm.status === "en vivo" || gameForm.status === "finalizado") && (
                      <>
                        <div>
                          <Label htmlFor="home-score">Marcador Local</Label>
                          <Input
                            id="home-score"
                            type="number"
                            value={gameForm.home_score}
                            onChange={(e) => setGameForm({ ...gameForm, home_score: e.target.value })}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="away-score">Marcador Visitante</Label>
                          <Input
                            id="away-score"
                            type="number"
                            value={gameForm.away_score}
                            onChange={(e) => setGameForm({ ...gameForm, away_score: e.target.value })}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        {editingGame ? "Actualizar Partido" : "Crear Partido"}
                      </Button>
                      {editingGame && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingGame(null)
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
                              home_score: "",
                              away_score: "",
                            })
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Partidos Programados ({games.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {games.map((game) => (
                      <div key={game.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">
                            {game.home_team} vs {game.away_team}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => {
                                setEditingGame(game)
                                setGameForm({
                                  home_team: game.home_team,
                                  away_team: game.away_team,
                                  game_date: game.game_date,
                                  game_time: game.game_time,
                                  venue: game.venue,
                                  field: game.field,
                                  category: game.category,
                                  referee1: game.referee1 || "",
                                  referee2: game.referee2 || "",
                                  status: game.status,
                                  home_score: game.home_score?.toString() || "",
                                  away_score: game.away_score?.toString() || "",
                                })
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete("games", game.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            {game.game_date} • {game.game_time}
                          </div>
                          <div>
                            {game.venue} - {game.field}
                          </div>
                          <div>Categoría: {game.category}</div>
                          {game.referee1 && <div>Árbitro: {game.referee1}</div>}
                          {game.referee2 && <div>Asistente: {game.referee2}</div>}
                          <div className="flex items-center justify-between">
                            {getStatusBadge(game.status)}
                            {(game.home_score !== null || game.away_score !== null) && (
                              <div className="font-semibold">
                                {game.home_score || 0} - {game.away_score || 0}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Agregar Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div>
                      <Label htmlFor="staff-name">Nombre</Label>
                      <Input
                        id="staff-name"
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-role">Rol</Label>
                      <select
                        id="staff-role"
                        value={staffForm.role}
                        onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="coordinator">Coordinador</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="staff-phone">Teléfono</Label>
                      <Input
                        id="staff-phone"
                        value={staffForm.phone}
                        onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-email">Email (opcional)</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      />
                    </div>
                    {staffForm.email && (
                      <div>
                        <Label htmlFor="staff-password">Contraseña (opcional)</Label>
                        <div className="relative">
                          <Input
                            id="staff-password"
                            type={showPasswords.staff ? "text" : "password"}
                            value={staffForm.password}
                            onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                            placeholder="Dejar vacío para generar automáticamente"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, staff: !showPasswords.staff })}
                          >
                            {showPasswords.staff ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Permisos</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={staffForm.can_edit_games}
                            onChange={(e) => setStaffForm({ ...staffForm, can_edit_games: e.target.checked })}
                          />
                          <span>Puede editar partidos</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={staffForm.can_edit_scores}
                            onChange={(e) => setStaffForm({ ...staffForm, can_edit_scores: e.target.checked })}
                          />
                          <span>Puede editar marcadores</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={staffForm.can_manage_payments}
                            onChange={(e) => setStaffForm({ ...staffForm, can_manage_payments: e.target.checked })}
                          />
                          <span>Puede gestionar pagos</span>
                        </label>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Agregar Staff
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Staff Registrado ({staff.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {staff.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-semibold">{member.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.role} • {member.phone || "Sin teléfono"}
                          </div>
                          {member.user && (
                            <div className="text-xs text-blue-600">
                              Usuario: {member.user.username} • {getStatusBadge(member.user.status)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Permisos: {member.can_edit_games && "Editar partidos"}{" "}
                            {member.can_edit_scores && "Editar marcadores"}{" "}
                            {member.can_manage_payments && "Gestionar pagos"}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete("staff", member.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Referees Tab */}
          <TabsContent value="referees">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Agregar Árbitro</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateReferee} className="space-y-4">
                    <div>
                      <Label htmlFor="referee-name">Nombre</Label>
                      <Input
                        id="referee-name"
                        value={refereeForm.name}
                        onChange={(e) => setRefereeForm({ ...refereeForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="referee-phone">Teléfono</Label>
                      <Input
                        id="referee-phone"
                        value={refereeForm.phone}
                        onChange={(e) => setRefereeForm({ ...refereeForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="referee-email">Email (opcional)</Label>
                      <Input
                        id="referee-email"
                        type="email"
                        value={refereeForm.email}
                        onChange={(e) => setRefereeForm({ ...refereeForm, email: e.target.value })}
                      />
                    </div>
                    {refereeForm.email && (
                      <div>
                        <Label htmlFor="referee-password">Contraseña (opcional)</Label>
                        <div className="relative">
                          <Input
                            id="referee-password"
                            type={showPasswords.referee ? "text" : "password"}
                            value={refereeForm.password}
                            onChange={(e) => setRefereeForm({ ...refereeForm, password: e.target.value })}
                            placeholder="Dejar vacío para generar automáticamente"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, referee: !showPasswords.referee })}
                          >
                            {showPasswords.referee ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="license-number">Número de Licencia</Label>
                      <Input
                        id="license-number"
                        value={refereeForm.license_number}
                        onChange={(e) => setRefereeForm({ ...refereeForm, license_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="certification-level">Nivel de Certificación</Label>
                      <select
                        id="certification-level"
                        value={refereeForm.certification_level}
                        onChange={(e) => setRefereeForm({ ...refereeForm, certification_level: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="junior">Junior</option>
                        <option value="senior">Senior</option>
                        <option value="expert">Experto</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="hourly-rate">Tarifa por Hora</Label>
                      <Input
                        id="hourly-rate"
                        type="number"
                        step="0.01"
                        value={refereeForm.hourly_rate}
                        onChange={(e) => setRefereeForm({ ...refereeForm, hourly_rate: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Agregar Árbitro
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Árbitros Registrados ({referees.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {referees.map((referee) => (
                      <div key={referee.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-semibold">{referee.name}</div>
                          <div className="text-sm text-gray-600">
                            {referee.certification_level} • ${referee.hourly_rate}/hora
                          </div>
                          {referee.license_number && (
                            <div className="text-xs text-gray-500">Licencia: {referee.license_number}</div>
                          )}
                          {referee.status && <div className="text-xs">{getStatusBadge(referee.status)}</div>}
                          {referee.user && (
                            <div className="text-xs text-blue-600">
                              Usuario: {referee.user.username} • {getStatusBadge(referee.user.status)}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDelete("referees", referee.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Registrar Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div>
                      <Label htmlFor="payment-type">Tipo de Pago</Label>
                      <select
                        id="payment-type"
                        value={paymentForm.type}
                        onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="team_registration">Registro de Equipo</option>
                        <option value="arbitration">Arbitraje</option>
                        <option value="fine">Multa</option>
                        <option value="penalty">Penalización</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="payment-amount">Monto</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-description">Descripción</Label>
                      <Input
                        id="payment-description"
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-team">Equipo (opcional)</Label>
                      <select
                        id="payment-team"
                        value={paymentForm.team_id}
                        onChange={(e) => setPaymentForm({ ...paymentForm, team_id: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Sin equipo</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="payment-referee">Árbitro (opcional)</Label>
                      <select
                        id="payment-referee"
                        value={paymentForm.referee_id}
                        onChange={(e) => setPaymentForm({ ...paymentForm, referee_id: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Sin árbitro</option>
                        {referees.map((referee) => (
                          <option key={referee.id} value={referee.id}>
                            {referee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="payment-player">Jugador (opcional)</Label>
                      <select
                        id="payment-player"
                        value={paymentForm.player_id}
                        onChange={(e) => setPaymentForm({ ...paymentForm, player_id: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Sin jugador</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name} - {player.team?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="payment-status">Estado</Label>
                      <select
                        id="payment-status"
                        value={paymentForm.status}
                        onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="overdue">Vencido</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="due-date">Fecha de Vencimiento</Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={paymentForm.due_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Registrar Pago
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Pagos Registrados ({payments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-semibold">
                            ${payment.amount} - {payment.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payment.type} • Vence: {payment.due_date}
                          </div>
                          {payment.team && <div className="text-xs text-gray-500">Equipo: {payment.team.name}</div>}
                          {payment.referee && (
                            <div className="text-xs text-gray-500">Árbitro: {payment.referee.name}</div>
                          )}
                          {payment.player && (
                            <div className="text-xs text-gray-500">Jugador: {payment.player.name}</div>
                          )}
                          <div className="mt-1">{getStatusBadge(payment.status)}</div>
                        </div>
                        <Button
                          onClick={() => handleDelete("payments", payment.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Crear Noticia</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateNews} className="space-y-4">
                    <div>
                      <Label htmlFor="news-title">Título</Label>
                      <Input
                        id="news-title"
                        value={newsForm.title}
                        onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="news-content">Contenido</Label>
                      <textarea
                        id="news-content"
                        value={newsForm.content}
                        onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                        className="w-full p-2 border rounded min-h-32"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="news-author">Autor</Label>
                      <Input
                        id="news-author"
                        value={newsForm.author}
                        onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="news-image">URL de Imagen (opcional)</Label>
                      <Input
                        id="news-image"
                        value={newsForm.image_url}
                        onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Crear Noticia
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Noticias Publicadas ({news.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {news.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-semibold">{article.title}</div>
                          <div className="text-sm text-gray-600 line-clamp-2">{article.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Por {article.author} • {new Date(article.created_at).toLocaleDateString("es-ES")}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete("news", article.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
