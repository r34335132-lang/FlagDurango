"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Plus,
  UserPlus,
  Key,
  Mail,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react"

interface Team {
  id: number
  name: string
  category: string
  logo_url?: string
}

interface Player {
  id: number
  name: string
  jersey_number?: number
  position?: string
  photo_url?: string
  team_id: number
  user_id?: number
  profile_completed?: boolean
  admin_verified?: boolean
  teams?: Team
}

interface UserData {
  id: number
  username: string
  email: string
  role: string
}

interface NewPlayerCredentials {
  player_id: number
  player_name: string
  email: string
  password: string
}

export default function CoachPortal() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Modal de credenciales
  const [showCredentials, setShowCredentials] = useState(false)
  const [newCredentials, setNewCredentials] = useState<NewPlayerCredentials | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<"email" | "password" | null>(null)

  // Formulario de nuevo jugador
  const [newPlayerForm, setNewPlayerForm] = useState({
    name: "",
    jersey_number: "",
    position: "",
    team_id: "",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "coach" && userData.role !== "admin") {
      router.push("/")
      return
    }

    setUser(userData)
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/players"),
      ])

      const teamsData = await teamsRes.json()
      const playersData = await playersRes.json()

      if (teamsData.success) setTeams(teamsData.data || [])
      if (playersData.success) setPlayers(playersData.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createPlayer = async () => {
    if (!newPlayerForm.name || !newPlayerForm.team_id) {
      setMessage({ type: "error", text: "Nombre y equipo son requeridos" })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlayerForm.name,
          jersey_number: newPlayerForm.jersey_number || null,
          position: newPlayerForm.position || null,
          team_id: newPlayerForm.team_id,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Jugador creado exitosamente" })
        setNewPlayerForm({ name: "", jersey_number: "", position: "", team_id: newPlayerForm.team_id })
        fetchData()
      } else {
        setMessage({ type: "error", text: data.message })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error al crear jugador" })
    } finally {
      setCreating(false)
    }
  }

  const createPlayerAccount = async (playerId: number) => {
    if (!user) return

    setCreating(true)
    setMessage(null)

    try {
      const res = await fetch("/api/auth/register-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          coach_user_id: user.id,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setNewCredentials(data.data)
        setShowCredentials(true)
        fetchData()
      } else {
        setMessage({ type: "error", text: data.message })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error al crear cuenta" })
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (text: string, type: "email" | "password") => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
  }

  const filteredPlayers = selectedTeam
    ? players.filter((p) => p.team_id === Number(selectedTeam))
    : players

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Portal del Coach</h1>
              <p className="text-sm text-muted-foreground">Flag Durango</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Bienvenido, {user?.username}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <p className={message.type === "success" ? "text-green-600" : "text-destructive"}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Crear Jugador */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Jugador
              </CardTitle>
              <CardDescription>
                Registra un nuevo jugador en tu equipo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team">Equipo</Label>
                <Select
                  value={newPlayerForm.team_id}
                  onValueChange={(value) => setNewPlayerForm({ ...newPlayerForm, team_id: value })}
                >
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name} ({team.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Nombre del jugador"
                  value={newPlayerForm.name}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="number">Numero</Label>
                  <Input
                    id="number"
                    type="number"
                    placeholder="00"
                    value={newPlayerForm.jersey_number}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, jersey_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="position">Posicion</Label>
                  <Select
                    value={newPlayerForm.position}
                    onValueChange={(value) => setNewPlayerForm({ ...newPlayerForm, position: value })}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Posicion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QB">Quarterback</SelectItem>
                      <SelectItem value="RB">Running Back</SelectItem>
                      <SelectItem value="WR">Wide Receiver</SelectItem>
                      <SelectItem value="TE">Tight End</SelectItem>
                      <SelectItem value="RU">Rush</SelectItem>
                      <SelectItem value="LB">Linebacker</SelectItem>
                      <SelectItem value="DB">Defensive Back</SelectItem>
                      <SelectItem value="CB">Corner Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={createPlayer} 
                disabled={creating} 
                className="w-full"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Agregar Jugador
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Jugadores */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Jugadores Registrados
                  </CardTitle>
                  <CardDescription>
                    Crea cuentas para que los jugadores completen su perfil
                  </CardDescription>
                </div>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los equipos</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">
                            {player.jersey_number || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{player.position || "Sin posicion"}</span>
                          {player.teams && (
                            <>
                              <span>-</span>
                              <span>{player.teams.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {player.user_id ? (
                        <div className="flex items-center gap-2">
                          {player.profile_completed ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Perfil completo
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                          {player.admin_verified && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => createPlayerAccount(player.id)}
                          disabled={creating}
                        >
                          {creating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-1" />
                          )}
                          Crear Cuenta
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay jugadores registrados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Credenciales */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Cuenta Creada Exitosamente
            </DialogTitle>
            <DialogDescription>
              Comparte estas credenciales con el jugador para que pueda iniciar sesion y completar su perfil.
            </DialogDescription>
          </DialogHeader>

          {newCredentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="font-medium text-center">{newCredentials.player_name}</p>
                
                {/* Email */}
                <div>
                  <Label className="text-xs text-muted-foreground">Email de acceso</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 p-2 bg-background rounded border font-mono text-sm overflow-x-auto">
                      {newCredentials.email}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newCredentials.email, "email")}
                    >
                      {copied === "email" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label className="text-xs text-muted-foreground">Contrasena temporal</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 p-2 bg-background rounded border font-mono text-sm flex items-center justify-between">
                      <span>{showPassword ? newCredentials.password : "********"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newCredentials.password, "password")}
                    >
                      {copied === "password" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> Esta contrasena solo se muestra una vez. Asegurate de compartirla con el jugador.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCredentials(false)} className="w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
