"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Team {
  id: number
  name: string
  category: string
}

export default function RegisterCoachPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    team_id: "",
    team_name: "",
    category: "varonil-gold",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teams")
        const data = await res.json()
        if (data.success) setTeams(data.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/register-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          team_id: form.team_id ? Number.parseInt(form.team_id) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage("¡Registro enviado! Un admin debe aprobar tu acceso.")
        setForm({ username: "", email: "", password: "", team_id: "", team_name: "", category: "varonil-gold" })
      } else {
        setMessage(data.message || "Error al registrar")
      }
    } catch (e) {
      setMessage("Error de red")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Registro de Entrenador/Capitán</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Cargando...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Usuario</Label>
                    <Input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Seleccionar equipo (opcional)</Label>
                    <select
                      value={form.team_id}
                      onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">— Sin equipo —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Crear equipo nuevo (opcional)</Label>
                    <Input
                      placeholder="Nombre del equipo"
                      value={form.team_name}
                      onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="varonil-gold">Varonil Gold</option>
                      <option value="varonil-silver">Varonil Silver</option>
                      <option value="femenil-gold">Femenil Gold</option>
                      <option value="femenil-silver">Femenil Silver</option>
                      <option value="mixto-gold">Mixto Gold</option>
                      <option value="mixto-silver">Mixto Silver</option>
                      <option value="femenil-cooper">Femenil Cooper</option>
                    </select>
                  </div>
                </div>

                {message && (
                  <div className="p-3 rounded bg-yellow-50 border text-yellow-800">{message}</div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Enviando..." : "Registrarme"}
                </Button>

                <div className="text-sm text-gray-500 text-center mt-2">
                  Un administrador debe aprobar tu cuenta antes de que puedas gestionar tu equipo.
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
