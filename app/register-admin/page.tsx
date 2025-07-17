"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function RegisterAdmin() {
  const [formData, setFormData] = useState({
    username: "admin",
    email: "admin@ligaflagdurango.com",
    password: "admin123",
    confirmPassword: "admin123",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setMessage("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: "admin",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Usuario admin creado exitosamente!")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setMessage(`❌ Error: ${data.message}`)
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center text-2xl">👑 Crear Usuario Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white">Nombre de Usuario</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                required
              />
            </div>

            <div>
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                required
              />
            </div>

            <div>
              <Label className="text-white">Contraseña</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                required
              />
            </div>

            <div>
              <Label className="text-white">Confirmar Contraseña</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-white/20 hover:bg-white/30 text-white">
              {loading ? "Creando..." : "Crear Admin"}
            </Button>

            {message && (
              <div
                className={`text-center p-3 rounded ${
                  message.includes("✅") ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {message}
              </div>
            )}

            <div className="text-center">
              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="text-white/70 hover:text-white bg-transparent hover:bg-white/10"
              >
                ← Volver al Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
