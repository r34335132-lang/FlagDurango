"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
      console.log("Enviando datos:", form)

      const res = await fetch("/api/auth/register-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      console.log("Respuesta:", data)

      if (data.success) {
        setMessage("¡Registro exitoso! Ahora puedes hacer login y pagar la inscripción ($1,900 MXN).")
        setForm({
          username: "",
          email: "",
          password: "",
        })
      } else {
        setMessage(data.message || "Error al registrar")
      }
    } catch (e) {
      console.error("Error:", e)
      setMessage("Error de red")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-600 to-orange-500">
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Registro de Entrenador/Capitán</CardTitle>
            <p className="text-center text-gray-600">Crea tu cuenta para administrar tu equipo</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Solo Datos de Usuario */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Datos de Usuario</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Usuario *</Label>
                      <Input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        placeholder="tu_usuario"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="tu@correo.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Contraseña *</Label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Proceso de Registro:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Completa este formulario básico</li>
                    <li>Haz login con tu cuenta</li>
                    <li>Realiza el pago de inscripción</li>
                    <li>El administrador creará tu equipo</li>
                    <li>¡Comienza a administrar tu equipo!</li>
                  </ol>
                </div>

                <Button type="submit" disabled={submitting} className="w-full text-lg py-3">
                  {submitting ? "Registrando..." : "Crear Cuenta"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
