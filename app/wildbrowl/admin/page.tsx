"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Target, Plus, Trophy, Sword, Crown, UserPlus, Edit, Trash2, BarChart3, TrendingUp } from "lucide-react"

interface Participant {
  id: number
  user_id?: number | null
  player_name: string
  alias?: string | null
  image_url?: string | null
  category: string
  status: string
  payment_status: string
  payment_method: string
  created_at?: string
}

interface WBMatch {
  id: number
  participant1: { id: number; player_name: string; category: string; alias?: string; image_url?: string }
  participant2: { id: number; player_name: string; category: string; alias?: string; image_url?: string }
  participant1_score?: number | null
  participant2_score?: number | null
  scheduled_time?: string | null
  status: string
  round: string
  bracket_type: string
  match_number: number
  winner?: { id: number; player_name: string; alias?: string; image_url?: string } | null
  elimination_match: boolean
}

interface WBStats {
  id: number
  participant: {
    id: number
    player_name: string
    category: string
    alias?: string
    image_url?: string
  }
  matches_played: number
  matches_won: number
  matches_lost: number
  points_scored: number
  points_against: number
  lives_remaining: number
  bracket_type: string
  elimination_round?: string
  win_percentage: string
  point_differential: number
  ranking: number
  status_text: string
}

interface BracketData {
  varonil: {
    winners: { [round: string]: WBMatch[] }
    losers: { [round: string]: WBMatch[] }
    total_matches: number
    completed_matches: number
  }
  femenil: {
    winners: { [round: string]: WBMatch[] }
    losers: { [round: string]: WBMatch[] }
    total_matches: number
    completed_matches: number
  }
  champion_match: WBMatch | null
}

export default function WildBrowlAdmin() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<WBMatch[]>([])
  const [bracket, setBracket] = useState<BracketData | null>(null)
  const [stats, setStats] = useState<{ varonil: WBStats[]; femenil: WBStats[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("participants")

  // Forms
  const [participantForm, setParticipantForm] = useState({
    player_name: "",
    alias: "",
    image_url: "",
    category: "varonil",
    payment_method: "efectivo",
  })
  const [matchForm, setMatchForm] = useState({
    participant1_id: "",
    participant2_id: "",
    scheduled_time: "",
    round: "octavos",
    bracket_type: "winners",
  })
  const [editingMatch, setEditingMatch] = useState<WBMatch | null>(null)
  const [showParticipantForm, setShowParticipantForm] = useState(false)
  const [showMatchForm, setShowMatchForm] = useState(false)

  const load = async () => {
    try {
      const [pRes, mRes, bRes, sRes] = await Promise.all([
        fetch("/api/wildbrowl/participants"),
        fetch("/api/wildbrowl/matches"),
        fetch("/api/wildbrowl/bracket"),
        fetch("/api/wildbrowl/stats"),
      ])

      const [pData, mData, bData, sData] = await Promise.all([pRes.json(), mRes.json(), bRes.json(), sRes.json()])

      if (pData.success) setParticipants(pData.data || [])
      if (mData.success) setMatches(mData.data || [])
      if (bData.success) setBracket(bData.data)
      if (sData.success) setStats({ varonil: sData.data.varonil || [], femenil: sData.data.femenil || [] })
    } catch (e) {
      console.error("WildBrowl load error:", e)
    } finally {
      setLoading(false)
    }
  }

  const addParticipant = async () => {
    try {
      const res = await fetch("/api/wildbrowl/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participantForm),
      })
      const data = await res.json()
      if (data.success) {
        setParticipantForm({
          player_name: "",
          alias: "",
          image_url: "",
          category: "varonil",
          payment_method: "efectivo",
        })
        setShowParticipantForm(false)
        load()
      } else {
        alert(data.error || "Error al registrar participante")
      }
    } catch (e) {
      console.error("Error adding participant:", e)
      alert("Error al registrar participante")
    }
  }

  const createMatch = async () => {
    try {
      const res = await fetch("/api/wildbrowl/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant1_id: Number.parseInt(matchForm.participant1_id),
          participant2_id: Number.parseInt(matchForm.participant2_id),
          round: matchForm.round,
          scheduled_time: matchForm.scheduled_time || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMatchForm({
          participant1_id: "",
          participant2_id: "",
          scheduled_time: "",
          round: "octavos",
          bracket_type: "winners",
        })
        setShowMatchForm(false)
        load()
      } else {
        alert(data.error || "Error al crear partido")
      }
    } catch (e) {
      console.error("Error creating match:", e)
      alert("Error al crear partido")
    }
  }

  const updateMatchScore = async (matchId: number, scoreA: number, scoreB: number) => {
    try {
      const res = await fetch(`/api/wildbrowl/matches`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId,
          participant1_score: scoreA,
          participant2_score: scoreB,
          status: "finalizado",
        }),
      })
      const data = await res.json()
      if (data.success) {
        load()
        setEditingMatch(null)
      } else {
        alert(data.error || "Error al actualizar resultado")
      }
    } catch (e) {
      console.error("Error updating match:", e)
      alert("Error al actualizar resultado")
    }
  }

  const deleteMatch = async (matchId: number) => {
    if (!confirm("¿Estás seguro de eliminar este partido?")) return
    try {
      const res = await fetch(`/api/wildbrowl/matches`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: matchId }),
      })
      const data = await res.json()
      if (data.success) {
        load()
      } else {
        alert(data.error || "Error al eliminar partido")
      }
    } catch (e) {
      console.error("Error deleting match:", e)
      alert("Error al eliminar partido")
    }
  }

  const generateBracket = async (category: string, tournamentName?: string) => {
    const categoryParticipants = participants.filter((p) => p.category === category && p.payment_status === "pagado")
    if (categoryParticipants.length < 2) {
      alert(`Se necesitan al menos 2 participantes pagados en la categoría ${category}`)
      return
    }

    const message = tournamentName
      ? `¿Generar nuevo bracket "${tournamentName}" para la categoría ${category}?`
      : `¿Generar bracket para la categoría ${category}?`

    if (confirm(message)) {
      try {
        const res = await fetch("/api/wildbrowl/bracket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, tournament_name: tournamentName }),
        })
        const data = await res.json()
        if (data.success) {
          alert(data.message)
          load()
        } else {
          alert(data.error || "Error al generar bracket")
        }
      } catch (e) {
        console.error("Error generating bracket:", e)
        alert("Error al generar bracket")
      }
    }
  }

  const updatePaymentStatus = async (participantId: number, status: string) => {
    try {
      const res = await fetch("/api/wildbrowl/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participantId,
          payment_status: status,
        }),
      })
      const data = await res.json()
      if (data.success) {
        load()
      } else {
        alert(data.error || "Error al actualizar estado de pago")
      }
    } catch (e) {
      console.error("Error updating payment:", e)
      alert("Error al actualizar estado de pago")
    }
  }

  const eliminateParticipant = async (participantId: number) => {
    if (!confirm("¿Estás seguro de eliminar este participante del torneo?")) return
    try {
      const res = await fetch("/api/wildbrowl/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          action: "eliminate",
        }),
      })
      const data = await res.json()
      if (data.success) {
        load()
      } else {
        alert(data.error || "Error al eliminar participante")
      }
    } catch (e) {
      console.error("Error eliminating participant:", e)
      alert("Error al eliminar participante")
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <div className="container mx-auto px-4 py-10">Cargando WildBrowl Admin...</div>

  const varonilParticipants = participants.filter((p) => p.category === "varonil")
  const femenilParticipants = participants.filter((p) => p.category === "femenil")

  const renderBracketRound = (roundMatches: WBMatch[], roundName: string, bracketType: "winners" | "losers") => {
    if (!roundMatches || roundMatches.length === 0) return null

    return (
      <div key={`${roundName}-${bracketType}`} className="mb-6">
        <h4 className="font-bold mb-3 capitalize text-gray-800">
          {bracketType === "winners" ? "🏆 Winners: " : "💔 Losers: "}
          {roundName === "32avos"
            ? "32avos de Final"
            : roundName === "16avos"
              ? "16avos de Final"
              : roundName === "octavos"
                ? "Octavos de Final"
                : roundName === "cuartos"
                  ? "Cuartos de Final"
                  : roundName}
        </h4>
        <div className="grid gap-2">
          {roundMatches.map((match) => (
            <div
              key={match.id}
              className={`border rounded p-3 text-sm shadow-sm ${
                bracketType === "winners" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <img
                      src={match.participant1?.image_url || "/placeholder.svg?height=24&width=24&query=jugador"}
                      alt={match.participant1?.player_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{match.participant1?.player_name}</span>
                  </div>
                  <span>vs</span>
                  <div className="flex items-center gap-1">
                    <img
                      src={match.participant2?.image_url || "/placeholder.svg?height=24&width=24&query=jugador"}
                      alt={match.participant2?.player_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{match.participant2?.player_name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingMatch(match)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMatch(match.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {match.status === "finalizado" ? (
                <div className="text-lg font-bold text-green-600">
                  {match.participant1_score} - {match.participant2_score}
                  {match.winner && <span className="text-sm ml-2">→ {match.winner.player_name}</span>}
                </div>
              ) : (
                <Badge className={bracketType === "winners" ? "bg-green-600" : "bg-red-600"}>{match.status}</Badge>
              )}
              {match.elimination_match && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Eliminación
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="w-8 h-8 text-orange-500" />
          WildBrowl 1v1 - Administración
        </h1>
        <Button onClick={load} variant="outline">
          Recargar Datos
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Participantes
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Partidos
          </TabsTrigger>
          <TabsTrigger value="brackets" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Brackets
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="champions" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Campeones
          </TabsTrigger>
        </TabsList>

        {/* PARTICIPANTES */}
        <TabsContent value="participants" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Participantes Varonil ({varonilParticipants.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {varonilParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-white border rounded p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || "/placeholder.svg?height=32&width=32&query=jugador"}
                        alt={p.player_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-blue-900">{p.player_name}</div>
                        {p.alias && <div className="text-xs text-blue-600">"{p.alias}"</div>}
                        <div className="text-xs text-blue-600">
                          {p.payment_method} - {p.payment_status}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={p.status === "activo" ? "default" : "secondary"} className="bg-blue-600">
                        {p.status}
                      </Badge>
                      {p.payment_status === "pendiente" && (
                        <Button
                          size="sm"
                          onClick={() => updatePaymentStatus(p.id, "pagado")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Marcar Pagado
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => eliminateParticipant(p.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
                {varonilParticipants.length === 0 && (
                  <div className="text-center text-blue-500 py-8">No hay participantes varoniles</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardHeader>
                <CardTitle className="text-pink-800">Participantes Femenil ({femenilParticipants.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {femenilParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-white border rounded p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || "/placeholder.svg?height=32&width=32&query=jugadora"}
                        alt={p.player_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-pink-900">{p.player_name}</div>
                        {p.alias && <div className="text-xs text-pink-600">"{p.alias}"</div>}
                        <div className="text-xs text-pink-600">
                          {p.payment_method} - {p.payment_status}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={p.status === "activo" ? "default" : "secondary"} className="bg-pink-600">
                        {p.status}
                      </Badge>
                      {p.payment_status === "pendiente" && (
                        <Button
                          size="sm"
                          onClick={() => updatePaymentStatus(p.id, "pagado")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Marcar Pagado
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => eliminateParticipant(p.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
                {femenilParticipants.length === 0 && (
                  <div className="text-center text-pink-500 py-8">No hay participantes femeniles</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acciones de Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Button onClick={() => setShowParticipantForm(true)} className="bg-orange-600 hover:bg-orange-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrar Participante
                </Button>
                <Button
                  onClick={() => generateBracket("varonil")}
                  variant="outline"
                  disabled={varonilParticipants.filter((p) => p.payment_status === "pagado").length < 2}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Generar Bracket Varonil
                </Button>
                <Button
                  onClick={() => generateBracket("femenil")}
                  variant="outline"
                  disabled={femenilParticipants.filter((p) => p.payment_status === "pagado").length < 2}
                  className="border-pink-600 text-pink-600 hover:bg-pink-50"
                >
                  Generar Bracket Femenil
                </Button>
                <Button
                  onClick={() => {
                    const name = prompt("Nombre del nuevo torneo:")
                    if (name) {
                      const category = prompt("Categoría (varonil/femenil):")
                      if (category && ["varonil", "femenil"].includes(category)) {
                        generateBracket(category, name)
                      }
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Torneo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARTIDOS */}
        <TabsContent value="matches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Crear Partido Manual
                </span>
                <Button onClick={() => setShowMatchForm(true)} className="bg-orange-600 hover:bg-orange-700">
                  Nuevo Partido
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">
                  Partidos Varonil ({matches.filter((m) => m.participant1?.category === "varonil").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {matches
                  .filter((m) => m.participant1?.category === "varonil")
                  .map((match) => (
                    <div key={match.id} className="bg-white border rounded p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-blue-900 flex items-center gap-2">
                          <img
                            src={match.participant1?.image_url || "/placeholder.svg?height=24&width=24&query=jugador"}
                            alt={match.participant1?.player_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{match.participant1?.player_name}</span>
                          <span>vs</span>
                          <img
                            src={match.participant2?.image_url || "/placeholder.svg?height=24&width=24&query=jugador"}
                            alt={match.participant2?.player_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{match.participant2?.player_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingMatch(match)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMatch(match.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-blue-600 mb-2 flex gap-2">
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          {match.round}
                        </Badge>
                        <Badge className={match.bracket_type === "winners" ? "bg-green-600" : "bg-red-600"}>
                          {match.bracket_type === "winners" ? "Winners" : "Losers"}
                        </Badge>
                        {match.elimination_match && <Badge variant="destructive">Eliminación</Badge>}
                      </div>
                      {match.status === "finalizado" ? (
                        <div className="text-lg font-bold text-green-600">
                          {match.participant1_score} - {match.participant2_score}
                          {match.winner && <span className="text-sm ml-2">→ {match.winner.player_name}</span>}
                        </div>
                      ) : (
                        <Badge className="bg-blue-600">{match.status}</Badge>
                      )}
                    </div>
                  ))}
                {matches.filter((m) => m.participant1?.category === "varonil").length === 0 && (
                  <div className="text-center text-blue-500 py-8">No hay partidos varoniles</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardHeader>
                <CardTitle className="text-pink-800">
                  Partidos Femenil ({matches.filter((m) => m.participant1?.category === "femenil").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {matches
                  .filter((m) => m.participant1?.category === "femenil")
                  .map((match) => (
                    <div key={match.id} className="bg-white border rounded p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-pink-900 flex items-center gap-2">
                          <img
                            src={match.participant1?.image_url || "/placeholder.svg?height=24&width=24&query=jugadora"}
                            alt={match.participant1?.player_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{match.participant1?.player_name}</span>
                          <span>vs</span>
                          <img
                            src={match.participant2?.image_url || "/placeholder.svg?height=24&width=24&query=jugadora"}
                            alt={match.participant2?.player_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{match.participant2?.player_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingMatch(match)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMatch(match.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-pink-600 mb-2 flex gap-2">
                        <Badge variant="outline" className="border-pink-600 text-pink-600">
                          {match.round}
                        </Badge>
                        <Badge className={match.bracket_type === "winners" ? "bg-green-600" : "bg-red-600"}>
                          {match.bracket_type === "winners" ? "Winners" : "Losers"}
                        </Badge>
                        {match.elimination_match && <Badge variant="destructive">Eliminación</Badge>}
                      </div>
                      {match.status === "finalizado" ? (
                        <div className="text-lg font-bold text-green-600">
                          {match.participant1_score} - {match.participant2_score}
                          {match.winner && <span className="text-sm ml-2">→ {match.winner.player_name}</span>}
                        </div>
                      ) : (
                        <Badge className="bg-pink-600">{match.status}</Badge>
                      )}
                    </div>
                  ))}
                {matches.filter((m) => m.participant1?.category === "femenil").length === 0 && (
                  <div className="text-center text-pink-500 py-8">No hay partidos femeniles</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BRACKETS */}
        <TabsContent value="brackets" className="space-y-6">
          {bracket && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bracket Varonil */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">
                    Bracket Varonil ({bracket.varonil.completed_matches}/{bracket.varonil.total_matches})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {/* Winners Bracket */}
                  {Object.entries(bracket.varonil.winners).map(([round, roundMatches]) =>
                    renderBracketRound(roundMatches, round, "winners"),
                  )}

                  {/* Losers Bracket */}
                  {Object.keys(bracket.varonil.losers).length > 0 && (
                    <div className="border-t-2 border-red-300 pt-4 mt-4">
                      <h3 className="text-lg font-bold text-red-700 mb-4">💔 Losers Bracket</h3>
                      {Object.entries(bracket.varonil.losers).map(([round, roundMatches]) =>
                        renderBracketRound(roundMatches, round, "losers"),
                      )}
                    </div>
                  )}

                  {bracket.varonil.total_matches === 0 && (
                    <div className="text-center text-blue-500 py-8">No hay bracket generado aún</div>
                  )}
                </CardContent>
              </Card>

              {/* Bracket Femenil */}
              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                <CardHeader>
                  <CardTitle className="text-pink-800">
                    Bracket Femenil ({bracket.femenil.completed_matches}/{bracket.femenil.total_matches})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {/* Winners Bracket */}
                  {Object.entries(bracket.femenil.winners).map(([round, roundMatches]) =>
                    renderBracketRound(roundMatches, round, "winners"),
                  )}

                  {/* Losers Bracket */}
                  {Object.keys(bracket.femenil.losers).length > 0 && (
                    <div className="border-t-2 border-red-300 pt-4 mt-4">
                      <h3 className="text-lg font-bold text-red-700 mb-4">💔 Losers Bracket</h3>
                      {Object.entries(bracket.femenil.losers).map(([round, roundMatches]) =>
                        renderBracketRound(roundMatches, round, "losers"),
                      )}
                    </div>
                  )}

                  {bracket.femenil.total_matches === 0 && (
                    <div className="text-center text-pink-500 py-8">No hay bracket generado aún</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ESTADÍSTICAS */}
        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Estadísticas Varonil */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Estadísticas Varonil
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {stats.varonil.map((stat, index) => (
                      <div key={stat.id} className="bg-white border rounded p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <img
                              src={stat.participant.image_url || "/placeholder.svg?height=32&width=32&query=jugador"}
                              alt={stat.participant.player_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-semibold text-blue-900">{stat.participant.player_name}</div>
                              <div className="text-xs text-blue-600">{stat.status_text}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-800">
                              {stat.matches_won}W - {stat.matches_lost}L
                            </div>
                            <div className="text-xs text-blue-600">{stat.win_percentage}%</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{stat.points_scored}</div>
                            <div className="text-gray-500">Puntos A Favor</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">{stat.points_against}</div>
                            <div className="text-gray-500">Puntos En Contra</div>
                          </div>
                          <div className="text-center">
                            <div
                              className={`font-semibold ${stat.point_differential >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {stat.point_differential >= 0 ? "+" : ""}
                              {stat.point_differential}
                            </div>
                            <div className="text-gray-500">Diferencial</div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <Badge
                            className={
                              stat.lives_remaining === 2
                                ? "bg-green-600"
                                : stat.lives_remaining === 1
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                            }
                          >
                            {stat.lives_remaining === 2
                              ? "🏆 Winners"
                              : stat.lives_remaining === 1
                                ? "💔 Losers"
                                : "❌ Eliminado"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {stats.varonil.length === 0 && (
                      <div className="text-center text-blue-500 py-8">No hay estadísticas varoniles</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas Femenil */}
              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                <CardHeader>
                  <CardTitle className="text-pink-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Estadísticas Femenil
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {stats.femenil.map((stat, index) => (
                      <div key={stat.id} className="bg-white border rounded p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <img
                              src={stat.participant.image_url || "/placeholder.svg?height=32&width=32&query=jugadora"}
                              alt={stat.participant.player_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-semibold text-pink-900">{stat.participant.player_name}</div>
                              <div className="text-xs text-pink-600">{stat.status_text}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-pink-800">
                              {stat.matches_won}W - {stat.matches_lost}L
                            </div>
                            <div className="text-xs text-pink-600">{stat.win_percentage}%</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{stat.points_scored}</div>
                            <div className="text-gray-500">Puntos A Favor</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">{stat.points_against}</div>
                            <div className="text-gray-500">Puntos En Contra</div>
                          </div>
                          <div className="text-center">
                            <div
                              className={`font-semibold ${stat.point_differential >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {stat.point_differential >= 0 ? "+" : ""}
                              {stat.point_differential}
                            </div>
                            <div className="text-gray-500">Diferencial</div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                          <Badge
                            className={
                              stat.lives_remaining === 2
                                ? "bg-green-600"
                                : stat.lives_remaining === 1
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                            }
                          >
                            {stat.lives_remaining === 2
                              ? "🏆 Winners"
                              : stat.lives_remaining === 1
                                ? "💔 Losers"
                                : "❌ Eliminado"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {stats.femenil.length === 0 && (
                      <div className="text-center text-pink-500 py-8">No hay estadísticas femeniles</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* CAMPEONES */}
        <TabsContent value="champions" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Campeón Varonil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {bracket?.varonil.winners.final?.[0]?.winner ? (
                  <div>
                    <img
                      src={
                        bracket.varonil.winners.final[0].winner.image_url ||
                        "/placeholder.svg?height=64&width=64&query=campeon"
                      }
                      alt={bracket.varonil.winners.final[0].winner.player_name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                    />
                    <div className="text-2xl font-bold text-blue-800 mb-2">
                      {bracket.varonil.winners.final[0].winner.player_name}
                    </div>
                    <Badge className="bg-blue-600">Campeón Varonil</Badge>
                  </div>
                ) : (
                  <div className="text-blue-500">Pendiente</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardHeader>
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Campeona Femenil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {bracket?.femenil.winners.final?.[0]?.winner ? (
                  <div>
                    <img
                      src={
                        bracket.femenil.winners.final[0].winner.image_url ||
                        "/placeholder.svg?height=64&width=64&query=campeona"
                      }
                      alt={bracket.femenil.winners.final[0].winner.player_name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                    />
                    <div className="text-2xl font-bold text-pink-800 mb-2">
                      {bracket.femenil.winners.final[0].winner.player_name}
                    </div>
                    <Badge className="bg-pink-600">Campeona Femenil</Badge>
                  </div>
                ) : (
                  <div className="text-pink-500">Pendiente</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Campeón de Campeones
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {bracket?.champion_match?.winner ? (
                  <div>
                    <img
                      src={
                        bracket.champion_match.winner.image_url ||
                        "/placeholder.svg?height=64&width=64&query=campeon-supremo"
                      }
                      alt={bracket.champion_match.winner.player_name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                    />
                    <div className="text-2xl font-bold text-yellow-800 mb-2">
                      {bracket.champion_match.winner.player_name}
                    </div>
                    <Badge className="bg-yellow-600">🏆 Campeón Supremo 🏆</Badge>
                  </div>
                ) : (
                  <div className="text-yellow-600">Pendiente</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Final de Campeones */}
          {bracket?.champion_match && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-center text-yellow-800 text-xl">
                  🏆 FINAL SUPREMA - CAMPEÓN DE CAMPEONES 🏆
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <img
                        src={
                          bracket.champion_match.participant1?.image_url ||
                          "/placeholder.svg?height=48&width=48&query=finalista"
                        }
                        alt={bracket.champion_match.participant1?.player_name}
                        className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
                      />
                      <div className="font-semibold">{bracket.champion_match.participant1?.player_name}</div>
                    </div>
                    <div className="text-2xl font-bold">VS</div>
                    <div className="text-center">
                      <img
                        src={
                          bracket.champion_match.participant2?.image_url ||
                          "/placeholder.svg?height=48&width=48&query=finalista"
                        }
                        alt={bracket.champion_match.participant2?.player_name}
                        className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
                      />
                      <div className="font-semibold">{bracket.champion_match.participant2?.player_name}</div>
                    </div>
                  </div>
                  {bracket.champion_match.status === "finalizado" ? (
                    <div>
                      <div className="text-3xl font-bold text-yellow-800 mb-2">
                        {bracket.champion_match.participant1_score} - {bracket.champion_match.participant2_score}
                      </div>
                      <div className="text-xl font-bold text-yellow-800">
                        🏆 CAMPEÓN DE CAMPEONES: {bracket.champion_match.winner?.player_name} 🏆
                      </div>
                    </div>
                  ) : (
                    <Badge className="bg-yellow-600">Programado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para registrar participante */}
      {showParticipantForm && (
        <Dialog open={showParticipantForm} onOpenChange={setShowParticipantForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Participante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre del Jugador</Label>
                <Input
                  value={participantForm.player_name}
                  onChange={(e) => setParticipantForm({ ...participantForm, player_name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label>Alias/Apodo (opcional)</Label>
                <Input
                  value={participantForm.alias}
                  onChange={(e) => setParticipantForm({ ...participantForm, alias: e.target.value })}
                  placeholder="Apodo del participante"
                />
              </div>
              <div>
                <Label>URL de Imagen (opcional)</Label>
                <Input
                  type="url"
                  value={participantForm.image_url}
                  onChange={(e) => setParticipantForm({ ...participantForm, image_url: e.target.value })}
                  placeholder="https://ejemplo.com/foto.jpg"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  value={participantForm.category}
                  onChange={(e) => setParticipantForm({ ...participantForm, category: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="varonil">Varonil</option>
                  <option value="femenil">Femenil</option>
                </select>
              </div>
              <div>
                <Label>Método de Pago</Label>
                <select
                  value={participantForm.payment_method}
                  onChange={(e) => setParticipantForm({ ...participantForm, payment_method: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowParticipantForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={addParticipant} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Registrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para crear partido */}
      {showMatchForm && (
        <Dialog open={showMatchForm} onOpenChange={setShowMatchForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Partido Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Jugador A</Label>
                <select
                  value={matchForm.participant1_id}
                  onChange={(e) => setMatchForm({ ...matchForm, participant1_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar jugador</option>
                  {participants
                    .filter((p) => p.payment_status === "pagado")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.player_name} ({p.category})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Jugador B</Label>
                <select
                  value={matchForm.participant2_id}
                  onChange={(e) => setMatchForm({ ...matchForm, participant2_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar jugador</option>
                  {participants
                    .filter((p) => p.payment_status === "pagado" && p.id.toString() !== matchForm.participant1_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.player_name} ({p.category})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Ronda</Label>
                <select
                  value={matchForm.round}
                  onChange={(e) => setMatchForm({ ...matchForm, round: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="32avos">32avos de Final</option>
                  <option value="16avos">16avos de Final</option>
                  <option value="octavos">Octavos de Final</option>
                  <option value="cuartos">Cuartos de Final</option>
                  <option value="semifinal">Semifinal</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <Label>Tipo de Bracket</Label>
                <select
                  value={matchForm.bracket_type}
                  onChange={(e) => setMatchForm({ ...matchForm, bracket_type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="winners">Winners Bracket</option>
                  <option value="losers">Losers Bracket</option>
                </select>
              </div>
              <div>
                <Label>Fecha y Hora (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={matchForm.scheduled_time}
                  onChange={(e) => setMatchForm({ ...matchForm, scheduled_time: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowMatchForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={createMatch} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Crear Partido
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para editar partido */}
      {editingMatch && (
        <Dialog open={!!editingMatch} onOpenChange={() => setEditingMatch(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Resultado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center text-lg font-semibold flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={editingMatch.participant1?.image_url || "/placeholder.svg?height=32&width=32&query=jugador"}
                    alt={editingMatch.participant1?.player_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{editingMatch.participant1?.player_name}</span>
                </div>
                <span>vs</span>
                <div className="flex items-center gap-2">
                  <img
                    src={editingMatch.participant2?.image_url || "/placeholder.svg?height=32&width=32&query=jugador"}
                    alt={editingMatch.participant2?.player_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{editingMatch.participant2?.player_name}</span>
                </div>
              </div>
              <div className="text-center text-sm text-gray-600">
                {editingMatch.round} - {editingMatch.bracket_type === "winners" ? "Winners Bracket" : "Losers Bracket"}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{editingMatch.participant1?.player_name}</Label>
                  <Input type="number" min="0" defaultValue={editingMatch.participant1_score || 0} id="score_a" />
                </div>
                <div>
                  <Label>{editingMatch.participant2?.player_name}</Label>
                  <Input type="number" min="0" defaultValue={editingMatch.participant2_score || 0} id="score_b" />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Al finalizar el partido, las estadísticas se actualizarán automáticamente y el
                  perdedor será movido según las reglas de eliminación.
                </div>
              </div>
              <Button
                onClick={() => {
                  const scoreA = Number.parseInt((document.getElementById("score_a") as HTMLInputElement).value)
                  const scoreB = Number.parseInt((document.getElementById("score_b") as HTMLInputElement).value)
                  updateMatchScore(editingMatch.id, scoreA, scoreB)
                }}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Finalizar Partido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
