"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Player = { id: number; name: string; team_id: number }
type Team = { id: number; name: string; logo_url?: string | null; category: string }

const categories = [
  { value: "varonil-gold", label: "Varonil Gold" },
  { value: "varonil-silver", label: "Varonil Silver" },
  { value: "femenil-gold", label: "Femenil Gold" },
  { value: "femenil-silver", label: "Femenil Silver" },
  { value: "femenil-cooper", label: "Femenil Cooper" },
  { value: "mixto-gold", label: "Mixto Gold" },
  { value: "mixto-silver", label: "Mixto Silver" },
]

export default function AdminMVPsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    season: "2025",
    week_number: "",
    category: "",
    player_id: "",
    mvp_type: "weekly",
    notes: "",
  })

  const filteredPlayers = useMemo(() => {
    if (!form.category) return players
    const teamIds = new Set(teams.filter(t => t.category === form.category).map(t => t.id))
    return players.filter(p => teamIds.has(p.team_id))
  }, [players, teams, form.category])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [playersRes, teamsRes] = await Promise.all([fetch("/api/players"), fetch("/api/teams")])
        const [playersJson, teamsJson] = await Promise.all([playersRes.json(), teamsRes.json()])
        if (playersJson.success) setPlayers(playersJson.data || [])
        if (teamsJson.success) setTeams(teamsJson.data || [])
        if (!playersJson.success) throw new Error(playersJson.message || "Error cargando jugadores")
        if (!teamsJson.success) throw new Error(teamsJson.message || "Error cargando equipos")
      } catch (e: any) {
        setError(e.message || "Error cargando datos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (!form.player_id || !form.category) throw new Error("Selecciona jugador y categoría")
      const payload: any = {
        player_id: Number(form.player_id),
        season: form.season,
        category: form.category,
        mvp_type: form.mvp_type,
        notes: form.notes || undefined,
      }
      if (form.week_number !== "") {
        const wn = Number(form.week_number)
        if (Number.isFinite(wn)) payload.week_number = wn
      }

      const res = await fetch("/api/mvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "No se pudo crear el MVP")
      setForm((f) => ({ ...f, player_id: "", notes: "" }))
      alert("MVP creado")
    } catch (e: any) {
      setError(e.message || "Error creando MVP")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Admin - MVPs</h1>
        <Card>
          <CardHeader>
            <CardTitle>Registrar MVP de la Jornada</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={onSubmit}>
              <div>
                <Label>Temporada</Label>
                <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
              </div>
              <div>
                <Label>Semana (opcional)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.week_number}
                  onChange={(e) => setForm({ ...form, week_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Selecciona</option>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <Label>Jugador</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={form.player_id}
                  onChange={(e) => setForm({ ...form, player_id: e.target.value })}
                >
                  <option value="">Selecciona un jugador</option>
                  {filteredPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <Label>Notas (opcional)</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" className="w-full">Guardar MVP</Button>
              </div>
            </form>
            {error && <div className="mt-4 p-2 text-sm bg-red-50 text-red-700 rounded">{error}</div>}
            <div className="mt-6 text-sm text-gray-600">
              Usa /estadisticas para ver el bloque "MVP de la Jornada". Si eliges "Todas las Categorías" verás los más recientes de cualquier categoría.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
