"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, RefreshCw, Eye, EyeOff, Home, ImageIcon, Check } from 'lucide-react'

type Team = {
  id?: string
  name: string
  category?: string
  logo_url?: string
  is_institutional?: boolean
  coordinator_name?: string
  coordinator_phone?: string
  captain_photo_url?: string
  paid?: boolean
}

type Player = {
  id?: string
  team_id?: string
  name: string
  number?: string
  position?: string
  photo_url?: string
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
  created_at?: string
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
  created_at?: string
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
  created_at?: string
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
  match_type?: string
  created_at?: string
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
  const [wildbrowlEnabled, setWildbrowlEnabled] = useState<boolean>(false)
  const [gamesCategoryFilter, setGamesCategoryFilter] = useState<string>("")

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: "",
    category: "varonil-gold",
    captain_name: "",
    captain_phone: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    logo_url: "",
    captain_photo_url: "",
    is_institutional: false,
    coordinator_name: "",
    coordinator_phone: "",
    color1: "#3B82F6",
    color2: "#1E40AF",
  })

  const [playerForm, setPlayerForm] = useState({
    name: "",
    jersey_number: "",
    position: "",
    team_id: "",
    photo_url: "",
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
    match_type: "jornada",
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

  const [newTeam, setNewTeam] = useState<Team>({
    name: "",
    category: "",
    logo_url: "",
    is_institutional: false,
    coordinator_name: "",
    coordinator_phone: "",
    captain_photo_url: "",
  })

  const [newPlayer, setNewPlayer] = useState<Player>({
    name: "",
    number: "",
    position: "",
    photo_url: "",
    team_id: "",
  })

  const canCreatePlayer = useMemo(() => !!newPlayer.team_id, [newPlayer.team_id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [teamsRes, playersRes, staffRes, refereesRes, paymentsRes, gamesRes, newsRes, venuesRes, fieldsRes, cRes] =
        await Promise.all([
          fetch("/api/teams", { cache: "no-store" }),
          fetch("/api/players", { cache: "no-store" }),
          fetch("/api/staff"),
          fetch("/api/referees"),
          fetch("/api/payments"),
          fetch("/api/games"),
          fetch("/api/news"),
          fetch("/api/venues"),
          fetch("/api/fields"),
          fetch("/api/system-config", { cache: "no-store" }),
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
        cfg,
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
        cRes.json(),
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
      setWildbrowlEnabled(Boolean(cfg?.wildbrowl_enabled))
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
        body: JSON.stringify({
          ...teamForm,
          is_institutional: Boolean(teamForm.is_institutional),
          coordinator_name: teamForm.is_institutional ? teamForm.coordinator_name : null,
          coordinator_phone: teamForm.is_institutional ? teamForm.coordinator_phone : null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTeams([data.data, ...teams])
        setTeamForm({
          name: "",
          category: "varonil-gold",
          captain_name: "",
          captain_phone: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          logo_url: "",
          captain_photo_url: "",
          is_institutional: false,
          coordinator_name: "",
          coordinator_phone: "",
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
        setPlayerForm({ name: "", jersey_number: "", position: "", team_id: "", photo_url: "" })
        alert("Jugador creado exitosamente")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error creating player:", error)
      alert("Error al crear jugador")
    }
  }

  const handleUpdatePlayerPhoto = async (player: Player) => {
    const url = prompt(`Nueva URL de foto para ${player.name}:`, player.photo_url || "")
    if (url === null) return
    try {
      const res = await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: player.id, photo_url: url || null }),
      })
      const data = await res.json()
      if (data.success) {
        setPlayers(players.map((p) => (p.id === player.id ? { ...p, photo_url: url || null } : p)))
      } else {
        alert(data.message || "Error al actualizar foto")
      }
    } catch (e) {
      alert("Error al actualizar foto")
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
    } as const

    const config = (statusConfig as any)[status] || {
      color: "bg-gray-500",
      text: status,
    }

    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>
  }

  async function createTeam() {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTeam),
    })
    if (res.ok) {
      const created = await res.json()
      setTeams((prev) => [created, ...prev])
      setNewTeam({
        name: "",
        category: "",
        logo_url: "",
        is_institutional: false,
        coordinator_name: "",
        coordinator_phone: "",
        captain_photo_url: "",
      })
      alert("Equipo registrado")
    } else {
      const err = await res.text()
      alert("Error al registrar equipo: " + err)
    }
  }

  async function createPlayer() {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlayer),
    })
    if (res.ok) {
      const created = await res.json()
      setPlayers((prev) => [created, ...prev])
      setNewPlayer({ name: "", number: "", position: "", photo_url: "", team_id: newPlayer.team_id })
      alert("Jugador agregado")
    } else {
      const err = await res.text()
      alert("Error al agregar jugador: " + err)
    }
  }

  async function updatePlayerPhoto(playerId: string, photo_url: string) {
    const res = await fetch("/api/players", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: playerId, photo_url }),
    })
    if (res.ok) {
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, photo_url } : p)))
    } else {
      alert("No se pudo actualizar la foto")
    }
  }

  async function toggleWildbrowl() {
    const res = await fetch("/api/system-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wildbrowl_enabled: !wildbrowlEnabled }),
    })
    if (res.ok) {
      setWildbrowlEnabled((v) => !v)
    } else {
      alert("No se pudo actualizar WildBrowl")
    }
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
            <TabsTrigger value="teams" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Equipos
            </TabsTrigger>
            <TabsTrigger value="players" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Jugadores
            </TabsTrigger>
            <TabsTrigger value="games" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Partidos
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Staff
            </TabsTrigger>
            <TabsTrigger value="referees" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Árbitros
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Pagos
            </TabsTrigger>
            <TabsTrigger value="config" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Configuración
            </TabsTrigger>
            <TabsTrigger value="wildbrowl" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              WildBrowl
            </TabsTrigger>
          </TabsList>

          {/* Teams */}
          <TabsContent value="teams">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Crear Equipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Categoría</Label>
                        <select
                          value={teamForm.category}
                          onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value })}
                          className="w-full p-2 border rounded"
                        >
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
                        <Label>Capitán</Label>
                        <Input
                          value={teamForm.captain_name}
                          onChange={(e) => setTeamForm({ ...teamForm, captain_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Tel. Capitán</Label>
                        <Input
                          value={teamForm.captain_phone}
                          onChange={(e) => setTeamForm({ ...teamForm, captain_phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Logo URL</Label>
                        <Input value={teamForm.logo_url} onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })} />
                      </div>
                      <div>
                        <Label>Foto capitán URL</Label>
                        <Input
                          value={teamForm.captain_photo_url}
                          onChange={(e) => setTeamForm({ ...teamForm, captain_photo_url: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Color 1</Label>
                        <Input
                          type="color"
                          value={teamForm.color1}
                          onChange={(e) => setTeamForm({ ...teamForm, color1: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Color 2</Label>
                        <Input
                          type="color"
                          value={teamForm.color2}
                          onChange={(e) => setTeamForm({ ...teamForm, color2: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={teamForm.is_institutional}
                          onChange={(e) => setTeamForm({ ...teamForm, is_institutional: e.target.checked })}
                        />
                        <span>Equipo institucional</span>
                      </label>
                      {teamForm.is_institutional && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Coordinador educativo</Label>
                            <Input
                              value={teamForm.coordinator_name}
                              onChange={(e) => setTeamForm({ ...teamForm, coordinator_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Tel. Coordinador</Label>
                            <Input
                              value={teamForm.coordinator_phone}
                              onChange={(e) => setTeamForm({ ...teamForm, coordinator_phone: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Contacto</Label>
                        <Input
                          value={teamForm.contact_name}
                          onChange={(e) => setTeamForm({ ...teamForm, contact_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Tel. Contacto</Label>
                        <Input
                          value={teamForm.contact_phone}
                          onChange={(e) => setTeamForm({ ...teamForm, contact_phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email Contacto</Label>
                        <Input
                          type="email"
                          value={teamForm.contact_email}
                          onChange={(e) => setTeamForm({ ...teamForm, contact_email: e.target.value })}
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
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden"
                            style={{ background: `linear-gradient(45deg, ${team.color1}, ${team.color2})` }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {team.logo_url ? (
                              <img
                                src={team.logo_url || "/placeholder.svg?height=32&width=32&query=logo%20equipo"}
                                alt={team.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              team.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{team.name}</div>
                            <div className="text-sm text-gray-600">
                              {team.category} • {team.is_institutional ? "Institucional" : "Particular"}
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

          {/* Players */}
          <TabsContent value="players">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Agregar Jugador</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePlayer} className="space-y-4">
                    <div>
                      <Label>Nombre del Jugador</Label>
                      <Input
                        value={playerForm.name}
                        onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Número de Jersey</Label>
                      <Input
                        type="number"
                        value={playerForm.jersey_number}
                        onChange={(e) => setPlayerForm({ ...playerForm, jersey_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Posición</Label>
                      <Input
                        value={playerForm.position}
                        onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Equipo</Label>
                      <select
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
                    <div>
                      <Label>Foto URL</Label>
                      <Input
                        value={playerForm.photo_url}
                        onChange={(e) => setPlayerForm({ ...playerForm, photo_url: e.target.value })}
                        placeholder="https://..."
                      />
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
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={player.photo_url || "/placeholder.svg?height=32&width=32&query=jugador"}
                            alt={player.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold">
                              #{player.jersey_number} {player.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {player.position} • {player.team?.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdatePlayerPhoto(player)} variant="outline" size="sm">
                            <ImageIcon className="w-4 h-4 mr-1" />
                            Foto
                          </Button>
                          <Button
                            onClick={() => handleDelete("players", player.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Games */}
          <TabsContent value="games">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Crear/Editar Partido</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (editingGame) {
                        fetch("/api/games", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: editingGame.id,
                            status: gameForm.status,
                            home_score: gameForm.home_score ? Number.parseInt(gameForm.home_score) : null,
                            away_score: gameForm.away_score ? Number.parseInt(gameForm.away_score) : null,
                            match_type: gameForm.match_type,
                          }),
                        }).then(() => {
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
                            match_type: "jornada",
                          })
                          fetchData()
                          alert("Partido actualizado")
                        })
                      } else {
                        fetch("/api/games", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(gameForm),
                        }).then(() => {
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
                            match_type: "jornada",
                          })
                          fetchData()
                          alert("Partido creado")
                        })
                      }
                    }}
                    className="space-y-4"
                  >
                    {!editingGame && (
                      <>
                        <div>
                          <Label>Equipo Local</Label>
                          <select
                            value={gameForm.home_team}
                            onChange={(e) => setGameForm({ ...gameForm, home_team: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                          >
                            <option value="">Seleccionar equipo</option>
                            {teams
                              .filter((t) => t.category === gameForm.category)
                              .map((t) => (
                                <option key={t.id} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <Label>Equipo Visitante</Label>
                          <select
                            value={gameForm.away_team}
                            onChange={(e) => setGameForm({ ...gameForm, away_team: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                          >
                            <option value="">Seleccionar equipo</option>
                            {teams
                              .filter((t) => t.category === gameForm.category)
                              .map((t) => (
                                <option key={t.id} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Fecha</Label>
                            <Input
                              type="date"
                              value={gameForm.game_date}
                              onChange={(e) => setGameForm({ ...gameForm, game_date: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Hora</Label>
                            <Input
                              type="time"
                              value={gameForm.game_time}
                              onChange={(e) => setGameForm({ ...gameForm, game_time: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Sede</Label>
                            <Input
                              value={gameForm.venue}
                              onChange={(e) => setGameForm({ ...gameForm, venue: e.target.value })}
                              placeholder="Nombre de la sede"
                              required
                            />
                          </div>
                          <div>
                            <Label>Campo</Label>
                            <Input
                              value={gameForm.field}
                              onChange={(e) => setGameForm({ ...gameForm, field: e.target.value })}
                              placeholder="Nombre del campo"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <Label>Categoría</Label>
                            <select
                              value={gameForm.category}
                              onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })}
                              className="w-full p-2 border rounded"
                            >
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
                            <Label>Árbitro Principal</Label>
                            <Input
                              value={gameForm.referee1}
                              onChange={(e) => setGameForm({ ...gameForm, referee1: e.target.value })}
                              placeholder="(opcional)"
                            />
                          </div>
                          <div>
                            <Label>Árbitro Asistente</Label>
                            <Input
                              value={gameForm.referee2}
                              onChange={(e) => setGameForm({ ...gameForm, referee2: e.target.value })}
                              placeholder="(opcional)"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Tipo de Partido</Label>
                          <select
                            value={gameForm.match_type}
                            onChange={(e) => setGameForm({ ...gameForm, match_type: e.target.value })}
                            className="w-full p-2 border rounded"
                          >
                            <option value="jornada">Jornada</option>
                            <option value="semifinal">Semifinal</option>
                            <option value="final">Final</option>
                            <option value="amistoso">Amistoso</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Estado</Label>
                      <select
                        value={gameForm.status}
                        onChange={(e) => setGameForm({ ...gameForm, status: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="programado">Programado</option>
                        <option value="en vivo">En Vivo</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>

                    {(gameForm.status === "en vivo" || gameForm.status === "finalizado") && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Marcador Local</Label>
                          <Input
                            type="number"
                            value={gameForm.home_score}
                            onChange={(e) => setGameForm({ ...gameForm, home_score: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Marcador Visitante</Label>
                          <Input
                            type="number"
                            value={gameForm.away_score}
                            onChange={(e) => setGameForm({ ...gameForm, away_score: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
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
                              match_type: "jornada",
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
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle>Partidos Programados</CardTitle>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Filtrar por categoría:</label>
                    <select
                      value={gamesCategoryFilter}
                      onChange={(e) => setGamesCategoryFilter(e.target.value)}
                      className="p-2 border rounded text-sm"
                    >
                      <option value="">Todas</option>
                      <option value="varonil-gold">Varonil Gold</option>
                      <option value="varonil-silver">Varonil Silver</option>
                      <option value="femenil-gold">Femenil Gold</option>
                      <option value="femenil-silver">Femenil Silver</option>
                      <option value="femenil-cooper">Femenil Cooper</option>
                      <option value="mixto-gold">Mixto Gold</option>
                      <option value="mixto-silver">Mixto Silver</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {games
                      .filter((game) => !gamesCategoryFilter || game.category === gamesCategoryFilter)
                      .map((game) => (
                        <div key={game.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">
                              {game.home_team} vs {game.away_team}
                            </div>
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline">{game.match_type || "jornada"}</Badge>
                              <Button
                                onClick={() => {
                                  setEditingGame(game)
                                  setActiveTab("games")
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
                                    match_type: game.match_type || "jornada",
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

          {/* Payments */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader>
                  <CardTitle>Registrar Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      fetch("/api/payments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...paymentForm,
                          amount: Number.parseFloat(paymentForm.amount),
                          team_id: paymentForm.team_id ? Number.parseInt(paymentForm.team_id) : null,
                          referee_id: paymentForm.referee_id ? Number.parseInt(paymentForm.referee_id) : null,
                          player_id: paymentForm.player_id ? Number.parseInt(paymentForm.player_id) : null,
                        }),
                      }).then(async (r) => {
                        const data = await r.json()
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
                          alert("Pago creado")
                        } else {
                          alert(data.message || "Error al crear pago")
                        }
                      })
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>Tipo de Pago</Label>
                      <select
                        value={paymentForm.type}
                        onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="team_registration">Registro de Equipo</option>
                        <option value="arbitration">Arbitraje</option>
                        <option value="fine">Multa</option>
                        <option value="penalty">Penalización</option>
                      </select>
                    </div>
                    <div>
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Equipo (opcional)</Label>
                      <select
                        value={paymentForm.team_id}
                        onChange={(e) => setPaymentForm({ ...paymentForm, team_id: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Sin equipo</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <select
                        value={paymentForm.status}
                        onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="overdue">Vencido</option>
                      </select>
                    </div>
                    <div>
                      <Label>Fecha de Vencimiento</Label>
                      <Input
                        type="date"
                        value={paymentForm.due_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Guardar Pago
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
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-semibold">
                            ${p.amount} - {p.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            {p.type} • Vence: {p.due_date}
                          </div>
                          {p.team && <div className="text-xs text-gray-500">Equipo: {p.team.name}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(p.status)}
                          {p.status !== "paid" && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                const r = await fetch("/api/payments", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: p.id, status: "paid" }),
                                })
                                if (r.ok) {
                                  setPayments(payments.map((x) => (x.id === p.id ? { ...x, status: "paid" } : x)))
                                }
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Marcar pagado
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete("payments", p.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuración */}
          <TabsContent value="config">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Configuraciones de la Liga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="font-semibold">Temporada Iniciada</div>
                    <div className="text-white/70 text-sm">Controla el estado de la temporada</div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/system-config")
                        const data = await res.json()
                        const current =
                          (data?.data || []).find((x: any) => x.config_key === "season_started")?.config_value === "true"
                        const r2 = await fetch("/api/system-config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            config_key: "season_started",
                            config_value: current ? "false" : "true",
                            description: "Season started toggle",
                          }),
                        })
                        if (r2.ok) alert("Actualizado")
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Alternar
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="font-semibold">WildBrowl 1v1</div>
                    <div className="text-white/70 text-sm">Habilita o deshabilita el torneo 1v1</div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/system-config")
                        const data = await res.json()
                        const current =
                          (data?.data || []).find((x: any) => x.config_key === "wildbrowl_enabled")?.config_value ===
                          "true"
                        const r2 = await fetch("/api/system-config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            config_key: "wildbrowl_enabled",
                            config_value: current ? "false" : "true",
                            description: "WildBrowl toggle",
                          }),
                        })
                        if (r2.ok) alert("Actualizado")
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Alternar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
