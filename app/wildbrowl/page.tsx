"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Trophy, Users, Calendar, Sparkles, Play } from 'lucide-react'

type ConfigMap = Record<string, string>
type Participant = { id: number; player_name: string; email?: string; phone?: string; category?: string; paid?: boolean }
type Match = {
  id: number
  a_name: string
  b_name: string
  a_score?: number
  b_score?: number
  status: string
  scheduled_at?: string
  stage?: string
}

export default function WildBrowlPage() {
  const [config, setConfig] = useState<ConfigMap>({})
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [meEmail, setMeEmail] = useState<string | null>(null)
  const [form, setForm] = useState({ player_name: "", email: "", phone: "", category: "varonil" })
  const [msg, setMsg] = useState<string | null>(null)

  // Load session email (if any) to show "Mis juegos"
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const u = JSON.parse(userStr) as { email?: string }
        if (u?.email) setMeEmail(u.email)
      }
    } catch {}
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cfgRes, partRes, matchRes] = await Promise.all([
        fetch("/api/system-config", { cache: "no-store" }),
        fetch("/api/wildbrowl/participants", { cache: "no-store" }),
        fetch("/api/wildbrowl/matches", { cache: "no-store" }),
      ])
      const [cfg, p, m] = await Promise.all([cfgRes.json(), partRes.json(), matchRes.json()])
      if (cfg?.success) {
        const map: ConfigMap = {}
        for (const c of cfg.data as { config_key: string; config_value: string }[]) map[c.config_key] = c.config_value
        setConfig(map)
      }
      if (p?.success) setParticipants(p.data || [])
      if (m?.success) setMatches(m.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const enabled = config["wildbrowl_enabled"] === "true"

  const myMatches = useMemo(() => {
    if (!meEmail) return []
    const myName = participants.find((x) => x.email === meEmail)?.player_name
    if (!myName) return []
    return matches.filter((mt) => mt.a_name === myName || mt.b_name === myName)
  }, [meEmail, participants, matches])

  const standings = useMemo(() => {
    // Simple ranking: W-L from matches with status "finalizado"
    const table = new Map<string, { name: string; played: number; won: number; lost: number; pts: number }>()
    for (const p of participants) {
      table.set(p.player_name, { name: p.player_name, played: 0, won: 0, lost: 0, pts: 0 })
    }
    for (const mt of matches) {
      if (mt.status !== "finalizado") continue
      const a = table.get(mt.a_name)
      const b = table.get(mt.b_name)
      if (!a || !b) continue
      a.played += 1
      b.played += 1
      const aScore = mt.a_score ?? 0
      const bScore = mt.b_score ?? 0
      if (aScore === bScore) continue
      if (aScore > bScore) {
        a.won += 1
        b.lost += 1
        a.pts += 2
      } else {
        b.won += 1
        a.lost += 1
        b.pts += 2
      }
    }
    return Array.from(table.values()).sort((x, y) => y.pts - x.pts || y.won - x.won)
  }, [participants, matches])

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      const reg = await fetch("/api/wildbrowl/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await reg.json()
      if (reg.ok && data.success) {
        setMsg("Registro completado. Pronto recibirás tu programación.")
        setForm({ player_name: "", email: "", phone: "", category: "varonil" })
        loadAll()
      } else {
        setMsg(data.message || "No se pudo registrar")
      }
    } catch {
      setMsg("Error al registrar")
    }
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-center space-y-4">
          <Target className="w-12 h-12 mx-auto" />
          <h1 className="text-3xl font-bold">WildBrowl 1v1</h1>
          <p className="opacity-90">Las inscripciones y el torneo estarán disponibles pronto.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-xl">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700">
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 py-16 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/95 border border-black/10 rounded-full px-6 py-2 font-bold">
            <Target className="w-4 h-4" /> WildBrowl 1v1
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold text-white">Duelo 1v1 • Skill • Honor</h1>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto">
            Regístrate, compite y escala la clasificación. Sin equipos, solo tú.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-neutral-900 hover:bg-yellow-300 font-bold"
              onClick={() => document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Sparkles className="w-5 h-5 mr-2" /> Registrarme
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-neutral-900"
              onClick={() => document.getElementById("partidos")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Play className="w-5 h-5 mr-2" /> Ver Partidos
            </Button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-10">
        <Tabs defaultValue="resumen" className="space-y-6">
          <TabsList className="bg-neutral-100">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="partidos">Partidos</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Resumen */}
          <TabsContent value="resumen">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" /> Participantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{participants.length}</div>
                  <p className="text-sm text-neutral-600">Jugadores registrados</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-600" /> Partidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{matches.length}</div>
                  <p className="text-sm text-neutral-600">Totales (programados y finalizados)</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-600" /> En juego
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{matches.filter((m) => m.status === "en vivo").length}</div>
                  <p className="text-sm text-neutral-600">Partidos en vivo</p>
                </CardContent>
              </Card>
            </div>

            {/* Registro */}
            <div id="registro" className="mt-8 grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Jugador</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={register} className="space-y-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={form.player_name} onChange={(e) => setForm((p) => ({ ...p, player_name: e.target.value }))} required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <div>
                        <Label>Teléfono</Label>
                        <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Categoría</Label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full p-2 border rounded"
                      >
                        <option value="varonil">Varonil</option>
                        <option value="femenil">Femenil</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1">
                        Registrar jugador
                      </Button>
                      {/* Pagar se ofrece después, no primero */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          setMsg(null)
                          try {
                            const pref = await fetch("/api/payments/mercadopago/create-preference", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                type: "wildbrowl",
                                email: form.email,
                                player_name: form.player_name,
                                amount: 1900,
                              }),
                            })
                            const data = await pref.json()
                            const init =
                              data?.data?.init_point ||
                              data?.data?.sandbox_init_point ||
                              data?.data?.point_of_interaction?.transaction_data?.ticket_url
                            if (init) window.location.href = init
                            else setMsg("No se encontró URL de pago.")
                          } catch {
                            setMsg("Error iniciando pago")
                          }
                        }}
                      >
                        Pagar inscripción ($1900)
                      </Button>
                    </div>
                    {msg && <div className="text-sm text-red-600">{msg}</div>}
                  </form>
                </CardContent>
              </Card>

              {/* Mis juegos */}
              <Card>
                <CardHeader>
                  <CardTitle>Mis juegos</CardTitle>
                </CardHeader>
                <CardContent>
                  {myMatches.length === 0 ? (
                    <div className="text-sm text-neutral-600">Inicia sesión o regístrate para ver tus próximos juegos.</div>
                  ) : (
                    <div className="space-y-3">
                      {myMatches.map((m) => (
                        <div key={m.id} className="p-3 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {m.a_name} vs {m.b_name}
                            </div>
                            <div className="text-xs text-neutral-600">
                              {m.scheduled_at
                                ? new Date(m.scheduled_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
                                : "Por programar"}
                            </div>
                          </div>
                          <Badge variant="outline">{m.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Partidos */}
          <TabsContent value="partidos">
            <div id="partidos" className="grid lg:grid-cols-2 gap-6">
              {matches.map((m) => (
                <Card key={m.id} className="hover:shadow-md transition">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">
                        {m.a_name} vs {m.b_name}
                      </div>
                      <Badge className={m.status === "finalizado" ? "bg-green-600" : m.status === "en vivo" ? "bg-red-600" : "bg-blue-600"}>
                        {m.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-neutral-600">
                      {m.scheduled_at
                        ? new Date(m.scheduled_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
                        : "Fecha por confirmar"}
                    </div>
                    {m.status !== "programado" && (
                      <div className="mt-3 font-black text-xl">
                        {(m.a_score ?? 0)} - {(m.b_score ?? 0)}
                      </div>
                    )}
                    {m.stage && <div className="mt-1 text-xs text-neutral-500">Etapa: {m.stage}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
            {matches.length === 0 && <div className="text-neutral-600">No hay partidos aún.</div>}
          </TabsContent>

          {/* Estadísticas */}
          <TabsContent value="estadisticas">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Jugador</th>
                    <th className="py-2 pr-2">PJ</th>
                    <th className="py-2 pr-2">W</th>
                    <th className="py-2 pr-2">L</th>
                    <th className="py-2 pr-2">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr key={row.name} className="border-b hover:bg-neutral-50">
                      <td className="py-2 pr-2">{i + 1}</td>
                      <td className="py-2 pr-2">{row.name}</td>
                      <td className="py-2 pr-2">{row.played}</td>
                      <td className="py-2 pr-2">{row.won}</td>
                      <td className="py-2 pr-2">{row.lost}</td>
                      <td className="py-2 pr-2 font-bold">{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {standings.length === 0 && <div className="text-neutral-600 mt-4">Aún no hay estadísticas.</div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
