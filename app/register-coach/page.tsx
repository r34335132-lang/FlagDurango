"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterCoachPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white">
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Registro de Coach</CardTitle>
            <p className="text-sm text-gray-600 text-center">Regístrate como entrenador en Liga Flag Durango</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="Tu nombre de usuario"
                />
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  placeholder="Repite tu contraseña"
                />
              </div>

              {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

              {success && <div className="p-3 rounded bg-green-50 text-green-700 text-sm">{success}</div>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Registrando..." : "Registrarse como Coach"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Inicia sesión
                </a>
              </div>
            </form>

            {/* Información del proceso */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Proceso de Registro:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Completa este formulario</li>
                <li>2. Inicia sesión en tu dashboard</li>
                <li>3. Crea tu equipo y agrega jugadores</li>
                <li>4. Realiza el pago de inscripción</li>
                <li>5. El admin aprobará tu equipo</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
