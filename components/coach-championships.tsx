"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trophy, Plus, Trash2, Medal, Calendar } from "lucide-react"

interface Championship {
  id: number
  team_id: number
  coach_id: number
  title: string
  year: number
  tournament?: string
  position?: string
  description?: string
}

interface Team {
  id: number
  name: string
}

interface CoachChampionshipsProps {
  teams: Team[]
  coachId: number
}

export default function CoachChampionships({ teams, coachId }: CoachChampionshipsProps) {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    team_id: "",
    title: "",
    year: new Date().getFullYear(),
    tournament: "",
    position: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const loadChampionships = async () => {
    try {
      const res = await fetch(`/api/championships?coach_id=${coachId}`)
      const data = await res.json()
      if (data.success) setChampionships(data.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadChampionships()
  }, [coachId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, coach_id: coachId, team_id: Number(form.team_id) }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Campeonato agregado" })
        setForm({ team_id: "", title: "", year: new Date().getFullYear(), tournament: "", position: "", description: "" })
        setShowForm(false)
        await loadChampionships()
      } else {
        setMessage({ type: "error", text: data.message })
      }
    } catch {
      setMessage({ type: "error", text: "Error al guardar" })
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este campeonato?")) return
    try {
      const res = await fetch(`/api/championships?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        await loadChampionships()
        setMessage({ type: "success", text: "Campeonato eliminado" })
      }
    } catch {}
  }

  const getTeamName = (teamId: number) => teams.find((t) => t.id === teamId)?.name || "Equipo"

  const getPositionColor = (pos?: string) => {
    if (!pos) return "bg-gray-100 text-gray-700"
    const p = pos.toLowerCase()
    if (p.includes("1") || p.includes("primer") || p.includes("campeon")) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    if (p.includes("2") || p.includes("segund") || p.includes("sub")) return "bg-gray-100 text-gray-600 border-gray-300"
    if (p.includes("3") || p.includes("tercer")) return "bg-orange-100 text-orange-700 border-orange-300"
    return "bg-blue-100 text-blue-700 border-blue-300"
  }

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center text-gray-500">Cargando historial...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Historial de Campeonatos</h2>
        <Button onClick={() => setShowForm(!showForm)} className={showForm ? "bg-gray-600 hover:bg-gray-700" : "bg-yellow-600 hover:bg-yellow-700"}>
          {showForm ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" />Agregar</>}
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <Card className="bg-white border-gray-200 border-2 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Nuevo Campeonato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900">Equipo</Label>
                  <select
                    value={form.team_id}
                    onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                    className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                    required
                  >
                    <option value="">Seleccionar equipo</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-gray-900">Anio</Label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="bg-white border-gray-300 text-gray-900"
                    min={1990}
                    max={2030}
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-900">Titulo / Logro</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  placeholder="Ej: Campeon Liga Durango"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900">Torneo / Liga</Label>
                  <Input
                    value={form.tournament}
                    onChange={(e) => setForm({ ...form, tournament: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    placeholder="Ej: Liga Municipal 2024"
                  />
                </div>
                <div>
                  <Label className="text-gray-900">Posicion / Lugar</Label>
                  <Input
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    placeholder="Ej: 1er Lugar, Campeon, Subcampeon"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-900">Descripcion (opcional)</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900 placeholder-gray-400 min-h-[80px]"
                  placeholder="Detalles adicionales del campeonato..."
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-yellow-600 hover:bg-yellow-700">
                {saving ? "Guardando..." : "Guardar Campeonato"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {championships.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay campeonatos registrados aun</p>
            <p className="text-gray-400 text-sm mt-1">Agrega tu historial de logros y campeonatos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {championships.map((ch) => (
            <Card key={ch.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Medal className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-lg">{ch.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className={getPositionColor(ch.position)}>
                          {ch.position || "Participacion"}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ch.year}
                        </span>
                        <span className="text-sm text-gray-500">{getTeamName(ch.team_id)}</span>
                      </div>
                      {ch.tournament && <p className="text-sm text-gray-600 mt-1">{ch.tournament}</p>}
                      {ch.description && <p className="text-sm text-gray-400 mt-1">{ch.description}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ch.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
