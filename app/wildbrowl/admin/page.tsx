"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Target, Play, Plus, Trophy, Sword, Crown, UserPlus, Edit, Trash2 } from "lucide-react"

interface Participant {
  id: number
  user_id?: number | null
  name: string
  alias?: string | null
  category: string
  status: string
  created_at?: string
}

interface WBMatch {
  id: number
  player_a: string
  player_b: string
  scheduled_date?: string | null
  scheduled_time?: string | null
  status: string
  score_a?: number | null
  score_b?: number | null
  round: string
  category: string
  winner?: string | null
}

export default function WildBrowlAdmin() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<WBMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("participants")

  // Forms
  const [participantForm, setParticipantForm] = useState({
    name: "",
    alias: "",
    category: "varonil",
  })
  const [matchForm, setMatchForm] = useState({
    player_a: "",
    player_b: "",
    scheduled_date: "",
    scheduled_time: "",
    round: "octavos",
    category: "varonil",
  })
  const [editingMatch, setEditingMatch] = useState<WBMatch | null>(null)

  const load = async () => {
    try {
      const [pRes, mRes] = await Promise.all([fetch("/api/wildbrowl/participants"), fetch("/api/wildbrowl/matches")])
      const [pData, mData] = await Promise.all([pRes.json(), mRes.json()])
      if (pData.success) setParticipants(pData.data || [])
      if (mData.success) setMatches(mData.data || [])
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
        body: JSON.stringify({
          name: participantForm.name,
          alias: participantForm.alias || null,
          category: participantForm.category,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setParticipantForm({ name: "", alias: "", category: "varonil" })
        load()
      }
    } catch (e) {
      console.error("Error adding participant:", e)
    }
  }

  const createMatch = async () => {
    try {
      const res = await fetch("/api/wildbrowl/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_a: matchForm.player_a,
          player_b: matchForm.player_b,
          scheduled_date: matchForm.scheduled_date || null,
          scheduled_time: matchForm.scheduled_time || null,
          round: matchForm.round,
          category: matchForm.category,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMatchForm({
          player_a: "",
          player_b: "",
          scheduled_date: "",
          scheduled_time: "",
          round: "octavos",
          category: "varonil",
        })
        load()
      }
    } catch (e) {
      console.error("Error creating match:", e)
    }
  }

  const updateMatchScore = async (matchId: number, scoreA: number, scoreB: number) => {
    try {
      const match = matches.find((m) => m.id === matchId)
      if (!match) return

      const winner = scoreA > scoreB ? match.player_a : match.player_b

      const res = await fetch(`/api/wildbrowl/matches`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId,
          score_a: scoreA,
          score_b: scoreB,
          status: "finalizado",
          winner: winner,
        }),
      })
      const data = await res.json()
      if (data.success) {
        load()
        setEditingMatch(null)
      }
    } catch (e) {
      console.error("Error updating match:", e)
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
      }
    } catch (e) {
      console.error("Error deleting match:", e)
    }
  }

  const generateBracket = async (category: string) => {
    const categoryParticipants = participants.filter((p) => p.category === category && p.status === "activo")
    if (categoryParticipants.length < 2) {
      alert(`Se necesitan al menos 2 participantes en la categoría ${category}`)
      return
    }

    // Crear partidos de primera ronda
    const matches = []
    for (let i = 0; i < categoryParticipants.length; i += 2) {
      if (i + 1 < categoryParticipants.length) {
        matches.push({
          player_a: categoryParticipants[i].name,
          player_b: categoryParticipants[i + 1].name,
          round:
            categoryParticipants.length <= 4 ? "semifinal" : categoryParticipants.length <= 8 ? "cuartos" : "octavos",
          category: category,
        })
      }
    }

    // Crear los partidos
    for (const match of matches) {
      await fetch("/api/wildbrowl/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(match),
      })
    }

    load()
  }

  const createChampionMatch = async () => {
    const varonilChampion = varonilMatches.find((m) => m.round === "final" && m.status === "finalizado")?.winner
    const femenilChampion = femenilMatches.find((m) => m.round === "final" && m.status === "finalizado")?.winner

    if (!varonilChampion || !femenilChampion) return

    try {
      const res = await fetch("/api/wildbrowl/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_a: varonilChampion,
          player_b: femenilChampion,
          round: "champion_of_champions",
          category: "mixto",
        }),
      })
      const data = await res.json()
      if (data.success) {
        load()
      }
    } catch (e) {
      console.error("Error creating champion match:", e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <div className="container mx-auto px-4 py-10">Cargando WildBrowl Admin...</div>

  const varonilParticipants = participants.filter((p) => p.category === "varonil")
  const femenilParticipants = participants.filter((p) => p.category === "femenil")
  const varonilMatches = matches.filter((m) => m.category === "varonil")
  const femenilMatches = matches.filter((m) => m.category === "femenil")

  const getMatchesByRound = (categoryMatches: WBMatch[], round: string) => {
    return categoryMatches.filter((m) => m.round === round)
  }

  const getChampions = () => {
    const varonilChampion = varonilMatches.find((m) => m.round === "final" && m.status === "finalizado")?.winner
    const femenilChampion = femenilMatches.find((m) => m.round === "final" && m.status === "finalizado")?.winner
    return { varonilChampion, femenilChampion }
  }

  const { varonilChampion, femenilChampion } = getChampions()
  const canCreateChampionMatch =
    varonilChampion && femenilChampion && !matches.find((m) => m.round === "champion_of_champions")

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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="champions" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Campeones
          </TabsTrigger>
        </TabsList>

        {/* PARTICIPANTES */}
        <TabsContent value="participants" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Registrar Participante
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre Completo</Label>
                  <Input
                    value={participantForm.name}
                    onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })}
                    placeholder="Nombre del participante"
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
                <Button onClick={addParticipant} className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrar Participante
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{varonilParticipants.length}</div>
                    <div className="text-sm text-blue-600">Varonil</div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded">
                    <div className="text-2xl font-bold text-pink-600">{femenilParticipants.length}</div>
                    <div className="text-sm text-pink-600">Femenil</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => generateBracket("varonil")}
                    className="w-full"
                    variant="outline"
                    disabled={varonilParticipants.length < 2}
                  >
                    Generar Bracket Varonil
                  </Button>
                  <Button
                    onClick={() => generateBracket("femenil")}
                    className="w-full"
                    variant="outline"
                    disabled={femenilParticipants.length < 2}
                  >
                    Generar Bracket Femenil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Participantes */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Participantes Varonil ({varonilParticipants.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {varonilParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      {p.alias && <div className="text-sm text-gray-600">"{p.alias}"</div>}
                    </div>
                    <Badge variant={p.status === "activo" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                ))}
                {varonilParticipants.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No hay participantes varoniles</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-pink-600">Participantes Femenil ({femenilParticipants.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {femenilParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      {p.alias && <div className="text-sm text-gray-600">"{p.alias}"</div>}
                    </div>
                    <Badge variant={p.status === "activo" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                ))}
                {femenilParticipants.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No hay participantes femeniles</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PARTIDOS */}
        <TabsContent value="matches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Crear Partido Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Jugador A</Label>
                <select
                  value={matchForm.player_a}
                  onChange={(e) => setMatchForm({ ...matchForm, player_a: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar jugador</option>
                  {participants
                    .filter((p) => p.category === matchForm.category)
                    .map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.alias ? `(${p.alias})` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Jugador B</Label>
                <select
                  value={matchForm.player_b}
                  onChange={(e) => setMatchForm({ ...matchForm, player_b: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar jugador</option>
                  {participants
                    .filter((p) => p.category === matchForm.category)
                    .map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.alias ? `(${p.alias})` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  value={matchForm.category}
                  onChange={(e) => setMatchForm({ ...matchForm, category: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="varonil">Varonil</option>
                  <option value="femenil">Femenil</option>
                </select>
              </div>
              <div>
                <Label>Ronda</Label>
                <select
                  value={matchForm.round}
                  onChange={(e) => setMatchForm({ ...matchForm, round: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="octavos">Octavos de Final</option>
                  <option value="cuartos">Cuartos de Final</option>
                  <option value="semifinal">Semifinal</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <Label>Fecha (opcional)</Label>
                <Input
                  type="date"
                  value={matchForm.scheduled_date}
                  onChange={(e) => setMatchForm({ ...matchForm, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora (opcional)</Label>
                <Input
                  type="time"
                  value={matchForm.scheduled_time}
                  onChange={(e) => setMatchForm({ ...matchForm, scheduled_time: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={createMatch} className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Crear Partido
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Partidos */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Partidos Varonil ({varonilMatches.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {varonilMatches.map((match) => (
                  <div key={match.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {match.player_a} vs {match.player_b}
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
                    <div className="text-sm text-gray-600 mb-2">
                      <Badge variant="outline">{match.round}</Badge>
                      {match.scheduled_date && (
                        <span className="ml-2">
                          {match.scheduled_date} {match.scheduled_time}
                        </span>
                      )}
                    </div>
                    {match.status === "finalizado" ? (
                      <div className="text-lg font-bold text-green-600">
                        {match.score_a} - {match.score_b}
                        <span className="text-sm ml-2">Ganador: {match.winner}</span>
                      </div>
                    ) : (
                      <Badge>{match.status}</Badge>
                    )}
                  </div>
                ))}
                {varonilMatches.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No hay partidos varoniles</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-pink-600">Partidos Femenil ({femenilMatches.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {femenilMatches.map((match) => (
                  <div key={match.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {match.player_a} vs {match.player_b}
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
                    <div className="text-sm text-gray-600 mb-2">
                      <Badge variant="outline">{match.round}</Badge>
                      {match.scheduled_date && (
                        <span className="ml-2">
                          {match.scheduled_date} {match.scheduled_time}
                        </span>
                      )}
                    </div>
                    {match.status === "finalizado" ? (
                      <div className="text-lg font-bold text-green-600">
                        {match.score_a} - {match.score_b}
                        <span className="text-sm ml-2">Ganador: {match.winner}</span>
                      </div>
                    ) : (
                      <Badge>{match.status}</Badge>
                    )}
                  </div>
                ))}
                {femenilMatches.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No hay partidos femeniles</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BRACKETS */}
        <TabsContent value="brackets" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Bracket Varonil</CardTitle>
              </CardHeader>
              <CardContent>
                {["octavos", "cuartos", "semifinal", "final"].map((round) => {
                  const roundMatches = getMatchesByRound(varonilMatches, round)
                  if (roundMatches.length === 0) return null

                  return (
                    <div key={round} className="mb-6">
                      <h4 className="font-bold mb-3 capitalize">
                        {round === "octavos" ? "Octavos de Final" : round === "cuartos" ? "Cuartos de Final" : round}
                      </h4>
                      <div className="space-y-2">
                        {roundMatches.map((match) => (
                          <div key={match.id} className="border rounded p-2 text-sm">
                            <div className="font-semibold">
                              {match.player_a} vs {match.player_b}
                            </div>
                            {match.status === "finalizado" && (
                              <div className="text-green-600 font-bold">
                                {match.score_a} - {match.score_b} → {match.winner}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {varonilMatches.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No hay bracket generado aún</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-pink-600">Bracket Femenil</CardTitle>
              </CardHeader>
              <CardContent>
                {["octavos", "cuartos", "semifinal", "final"].map((round) => {
                  const roundMatches = getMatchesByRound(femenilMatches, round)
                  if (roundMatches.length === 0) return null

                  return (
                    <div key={round} className="mb-6">
                      <h4 className="font-bold mb-3 capitalize">
                        {round === "octavos" ? "Octavos de Final" : round === "cuartos" ? "Cuartos de Final" : round}
                      </h4>
                      <div className="space-y-2">
                        {roundMatches.map((match) => (
                          <div key={match.id} className="border rounded p-2 text-sm">
                            <div className="font-semibold">
                              {match.player_a} vs {match.player_b}
                            </div>
                            {match.status === "finalizado" && (
                              <div className="text-green-600 font-bold">
                                {match.score_a} - {match.score_b} → {match.winner}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {femenilMatches.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No hay bracket generado aún</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CAMPEONES */}
        <TabsContent value="champions" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Campeón Varonil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {varonilChampion ? (
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{varonilChampion}</div>
                    <Badge className="bg-blue-600">Campeón Varonil</Badge>
                  </div>
                ) : (
                  <div className="text-gray-500">Pendiente</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-pink-600 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Campeona Femenil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {femenilChampion ? (
                  <div>
                    <div className="text-2xl font-bold text-pink-600 mb-2">{femenilChampion}</div>
                    <Badge className="bg-pink-600">Campeona Femenil</Badge>
                  </div>
                ) : (
                  <div className="text-gray-500">Pendiente</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Campeón de Campeones
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {canCreateChampionMatch ? (
                  <Button onClick={createChampionMatch} className="bg-yellow-600 hover:bg-yellow-700">
                    Crear Final Suprema
                  </Button>
                ) : (
                  <div className="text-gray-500">
                    {matches.find((m) => m.round === "champion_of_champions")?.winner || "Pendiente"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Final de Campeones */}
          {matches.find((m) => m.round === "champion_of_champions") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-yellow-600 text-xl">
                  🏆 FINAL SUPREMA - CAMPEÓN DE CAMPEONES 🏆
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const championMatch = matches.find((m) => m.round === "champion_of_champions")
                  if (!championMatch) return null

                  return (
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-4">
                        {championMatch.player_a} vs {championMatch.player_b}
                      </div>
                      {championMatch.status === "finalizado" ? (
                        <div>
                          <div className="text-3xl font-bold text-yellow-600 mb-2">
                            {championMatch.score_a} - {championMatch.score_b}
                          </div>
                          <div className="text-xl font-bold text-yellow-600">
                            🏆 CAMPEÓN DE CAMPEONES: {championMatch.winner} 🏆
                          </div>
                        </div>
                      ) : (
                        <Badge className="bg-yellow-600">Programado</Badge>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para editar partido */}
      {editingMatch && (
        <Dialog open={!!editingMatch} onOpenChange={() => setEditingMatch(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Resultado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center text-lg font-semibold">
                {editingMatch.player_a} vs {editingMatch.player_b}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{editingMatch.player_a}</Label>
                  <Input type="number" min="0" defaultValue={editingMatch.score_a || 0} id="score_a" />
                </div>
                <div>
                  <Label>{editingMatch.player_b}</Label>
                  <Input type="number" min="0" defaultValue={editingMatch.score_b || 0} id="score_b" />
                </div>
              </div>
              <Button
                onClick={() => {
                  const scoreA = Number.parseInt((document.getElementById("score_a") as HTMLInputElement).value)
                  const scoreB = Number.parseInt((document.getElementById("score_b") as HTMLInputElement).value)
                  updateMatchScore(editingMatch.id, scoreA, scoreB)
                }}
                className="w-full"
              >
                Actualizar Resultado
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
