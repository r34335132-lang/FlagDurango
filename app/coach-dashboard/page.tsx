"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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

export default function CoachDashboardPage() {
  const [team, setTeam] = useState<Team>({
    name: "",
    category: "",
    logo_url: "",
    is_institutional: false,
    coordinator_name: "",
    coordinator_phone: "",
    captain_photo_url: "",
  })

  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayer, setNewPlayer] = useState<Player>({ name: "", number: "", position: "", photo_url: "" })

  const canPay = useMemo(() => Boolean(team.id && !team.paid), [team.id, team.paid])

  useEffect(() => {
    // Optionally load coach's team if backend supports it
  }, [])

  async function createTeam() {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    })
    if (res.ok) {
      const created = await res.json()
      setTeam(created)
      alert("Equipo registrado")
    } else {
      alert("No se pudo registrar el equipo")
    }
  }

  async function addPlayer() {
    if (!team.id) return alert("Primero registra tu equipo")
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPlayer, team_id: team.id }),
    })
    if (res.ok) {
      const created = await res.json()
      setPlayers((prev) => [created, ...prev])
      setNewPlayer({ name: "", number: "", position: "", photo_url: "" })
    } else {
      alert("No se pudo agregar jugador")
    }
  }

  async function payRegistration() {
    if (!team.id) return
    const res = await fetch("/api/payments/mercadopago/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: team.id }),
    })
    if (res.ok) {
      const pref = await res.json()
      const url = pref?.init_point || pref?.sandbox_init_point || pref?.url
      if (url) {
        window.location.href = url
      } else {
        alert("No se recibió URL de pago")
      }
    } else {
      alert("No se pudo iniciar el pago")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-400 via-fuchsia-500 to-violet-500 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard de Coach</h1>

        <Card>
          <CardHeader>
            <CardTitle>Registro de equipo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Nombre del equipo</Label>
              <Input
                value={team.name}
                onChange={(e) => setTeam((t) => ({ ...t, name: e.target.value }))}
                placeholder="Tiburones"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Input
                value={team.category}
                onChange={(e) => setTeam((t) => ({ ...t, category: e.target.value }))}
                placeholder="Varonil / Femenil / Mixto / Femenil Cooper"
              />
            </div>
            <div>
              <Label>Logo (URL)</Label>
              <Input
                value={team.logo_url}
                onChange={(e) => setTeam((t) => ({ ...t, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Foto del capitán (URL)</Label>
              <Input
                value={team.captain_photo_url}
                onChange={(e) => setTeam((t) => ({ ...t, captain_photo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-1 md:col-span-2 mt-2">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={Boolean(team.is_institutional)}
                  onChange={(e) => setTeam((t) => ({ ...t, is_institutional: e.target.checked }))}
                />
                Institucional
              </label>
            </div>
            {team.is_institutional ? (
              <>
                <div>
                  <Label>Coordinador educativo (nombre)</Label>
                  <Input
                    value={team.coordinator_name ?? ""}
                    onChange={(e) => setTeam((t) => ({ ...t, coordinator_name: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <Label>Coordinador educativo (teléfono)</Label>
                  <Input
                    value={team.coordinator_phone ?? ""}
                    onChange={(e) => setTeam((t) => ({ ...t, coordinator_phone: e.target.value }))}
                    placeholder="(618) 123 4567"
                  />
                </div>
              </>
            ) : null}
            <div className="col-span-1 md:col-span-2 flex items-center gap-3">
              <Button onClick={createTeam}>Guardar equipo</Button>
              <Button variant="secondary" onClick={payRegistration} disabled={!canPay}>
                Pagar registro
              </Button>
              {team.paid ? (
                <span className="rounded bg-green-100 px-2 py-1 text-green-700 text-xs">Pago confirmado</span>
              ) : (
                team.id && <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-700 text-xs">Pago pendiente</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar jugadores</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Nombre</Label>
              <Input
                value={newPlayer.name}
                onChange={(e) => setNewPlayer((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre del jugador"
              />
            </div>
            <div>
              <Label>Número</Label>
              <Input
                value={newPlayer.number}
                onChange={(e) => setNewPlayer((p) => ({ ...p, number: e.target.value }))}
                placeholder="00"
              />
            </div>
            <div>
              <Label>Posición</Label>
              <Input
                value={newPlayer.position}
                onChange={(e) => setNewPlayer((p) => ({ ...p, position: e.target.value }))}
                placeholder="WR / QB / RB / DB"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Foto (URL)</Label>
              <Input
                value={newPlayer.photo_url}
                onChange={(e) => setNewPlayer((p) => ({ ...p, photo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={addPlayer} disabled={!team.id}>
                Agregar
              </Button>
            </div>

            <div className="md:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {players.map((pl) => (
                  <div key={pl.id ?? pl.name} className="flex items-center gap-3 rounded-md bg-white/80 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {pl.photo_url ? (
                      <img src={pl.photo_url || "/placeholder.svg"} alt={"Foto " + pl.name} className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-neutral-200" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{pl.name}</div>
                      <div className="text-xs text-neutral-600">
                        {pl.position || "—"} {pl.number ? "• #" + pl.number : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-white/80">
          Nota: Los coaches pueden registrar equipo y jugadores y pagar el registro. La programación de partidos es solo
          para administradores.
        </p>
      </div>
    </div>
  )
}
