"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DebugLogin() {
  const [formData, setFormData] = useState({
    username: "admin",
    password: "admin123",
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("🔍 Probando login con:", formData)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      console.log("📡 Respuesta del servidor:", data)
      console.log("🍪 Cookies después del login:", document.cookie)

      setResult({
        success: data.success,
        message: data.message,
        user: data.user,
        status: response.status,
        cookies: document.cookie,
      })

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user))
        console.log("💾 Usuario guardado en localStorage")
      }
    } catch (error) {
      console.error("❌ Error:", error)
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const goToDashboard = () => {
    window.location.href = "/dashboard"
  }

  const checkCookies = () => {
    console.log("🍪 Cookies actuales:", document.cookie)
    console.log("💾 localStorage:", localStorage.getItem("user"))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🧪 Debug Login</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Probar Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Usuario</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Contraseña</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/20 border-white/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Button
                  onClick={testLogin}
                  disabled={loading}
                  className="w-full bg-white/20 hover:bg-white/30 text-white"
                >
                  {loading ? "Probando..." : "🔍 Probar Login"}
                </Button>
                <Button onClick={checkCookies} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  🍪 Verificar Cookies
                </Button>
                {result?.success && (
                  <Button onClick={goToDashboard} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    🚀 Ir al Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded ${result.success ? "bg-green-500/20 border border-green-500/50" : "bg-red-500/20 border border-red-500/50"}`}
                  >
                    <p className="text-white font-semibold">
                      {result.success ? "✅ Login Exitoso" : "❌ Login Fallido"}
                    </p>
                    <p className="text-white/70 text-sm">{result.message}</p>
                  </div>

                  {result.user && (
                    <div className="bg-white/10 p-3 rounded">
                      <h3 className="text-white font-semibold mb-2">👤 Datos del Usuario:</h3>
                      <pre className="text-white/80 text-xs overflow-auto">{JSON.stringify(result.user, null, 2)}</pre>
                    </div>
                  )}

                  <div className="bg-white/10 p-3 rounded">
                    <h3 className="text-white font-semibold mb-2">🍪 Cookies:</h3>
                    <p className="text-white/80 text-xs break-all">{result.cookies || "No cookies"}</p>
                  </div>

                  {result.error && (
                    <div className="bg-red-500/20 p-3 rounded border border-red-500/50">
                      <h3 className="text-white font-semibold mb-2">❌ Error:</h3>
                      <p className="text-white/80 text-sm">{result.error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-white/70">Haz clic en "Probar Login" para ver el resultado</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">📋 Credenciales de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-white/80">
              <div>
                <h3 className="font-semibold text-white mb-2">🔑 Usuarios Disponibles:</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>Admin:</strong> admin / admin123
                  </li>
                  <li>
                    <strong>Staff:</strong> staff / staff123
                  </li>
                  <li>
                    <strong>Referee:</strong> referee / ref123
                  </li>
                  <li>
                    <strong>User:</strong> testuser / test123
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">🛠️ Pasos de Debug:</h3>
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  <li>Probar login con credenciales</li>
                  <li>Verificar cookies establecidas</li>
                  <li>Ir al dashboard si es exitoso</li>
                  <li>Revisar console para logs detallados</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
