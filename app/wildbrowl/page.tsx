"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Trophy, Users, Calendar, DollarSign, Zap, Clock, MapPin } from "lucide-react"

interface SystemConfig {
  config_key: string
  config_value: string
}

interface WildBrowlMatch {
  id: number
  player1: string
  player2: string
  player1_score?: number
  player2_score?: number
  game_date: string
  game_time: string
  venue: string
  field: string
  status: string
  round: string
}

interface WildBrowlParticipant {
  id: number
  player_name: string
  email: string
  phone: string
  category: string
  paid: boolean
  created_at: string
}

export default function WildBrowlPage() {
  const [systemConfig, setSystemConfig] = useState<{ [key: string]: string }>({})
  const [matches, setMatches] = useState<WildBrowlMatch[]>([])
  const [participants, setParticipants] = useState<WildBrowlParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)

  const [registrationForm, setRegistrationForm] = useState({
    player_name: "",
    email: "",
    phone: "",
    category: "varonil",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [configResponse, matchesResponse, participantsResponse] = await Promise.all([
        fetch("/api/system-config"),
        fetch("/api/wildbrowl/matches"),
        fetch("/api/wildbrowl/participants"),
      ])

      const [configData, matchesData, participantsData] = await Promise.all([
        configResponse.json(),
        matchesResponse.json(),
        participantsResponse.json(),
      ])

      if (configData.success) {
        const configMap: { [key: string]: string } = {}
        configData.data.forEach((config: SystemConfig) => {
          configMap[config.config_key] = config.config_value
        })
        setSystemConfig(configMap)
      }

      if (matchesData.success) {
        setMatches(matchesData.data || [])
      }

      if (participantsData.success) {
        setParticipants(participantsData.data || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)

    try {
      const response = await fetch("/api/wildbrowl/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationForm),
      })

      const data = await response.json()

      if (data.success) {
        // Crear preferencia de pago
        const paymentResponse = await fetch("/api/payments/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_name: `WildBrowl - ${registrationForm.player_name}`,
            user_email: registrationForm.email,
            title: `WildBrowl 1v1 - ${registrationForm.player_name}`,
            amount: 100,
          }),
        })

        const paymentData = await paymentResponse.json()

        if (paymentData.success) {
          // Redirigir a MercadoPago
          window.location.href = paymentData.data.init_point
        } else {
          alert("Registro exitoso, pero hubo un error con el pago. Contacta al administrador.")
        }
      } else {
        alert(data.message || "Error al registrarse")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar el registro")
    } finally {
      setRegistering(false)
    }
  }

  const isWildBrowlEnabled = systemConfig.wildbrowl_enabled === "true"

  const liveMatches = matches.filter((m) => m.status === "en_vivo")
  const upcomingMatches = matches
    .filter((m) => m.status === "programado")
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
    .slice(0, 6)

  const recentMatches = matches
    .filter((m) => m.status === "finalizado")
    .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
    .slice(0, 6)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Cargando WildBrowl...</div>
      </div>
    )
  }

  if (!isWildBrowlEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <Target className="w-24 h-24 text-white/80 mx-auto mb-8" />
            <h1 className="text-6xl font-black text-white mb-6">WildBrowl 1v1</h1>
            <h2 className="text-3xl font-bold text-white/90 mb-8">Próximamente</h2>
            <p className="text-xl text-white font-bold italic mb-2 drop-shadow-lg">
              "¡Ni el ring es tan salvaje como este juego!"
            </p>
            <p className="text-lg text-white font-semibold mb-8 drop-shadow-lg">
              Un duelo, un balón, un solo sobreviviente.
            </p>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">¿Qué es WildBrowl?</h3>
                <div className="grid md:grid-cols-2 gap-6 text-white/90">
                  <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-3 text-orange-300" />
                    <h4 className="font-semibold mb-2">1 vs 1</h4>
                    <p className="text-sm">Enfrentamientos directos entre jugadores</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
                    <h4 className="font-semibold mb-2">Acción Rápida</h4>
                    <p className="text-sm">Partidos intensos y dinámicos</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                    <h4 className="font-semibold mb-2">Premiación</h4>
                    <p className="text-sm">Reconocimiento a los mejores</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-300" />
                    <h4 className="font-semibold mb-2">$100 MXN</h4>
                    <p className="text-sm">Inscripción por jugador</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-12">
              <Button
                onClick={() => (window.location.href = "/")}
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                variant="outline"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-orange-400/95 backdrop-blur-sm text-gray-900 px-6 py-2 rounded-full font-bold mb-6">
              🎯 Torneo WildBrowl 1v1 - ¡Inscripciones Abiertas!
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
              Wild
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Browl
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white font-bold italic mb-2 drop-shadow-lg">
              "¡Ni el ring es tan salvaje como este juego!"
            </p>
            <p className="text-lg md:text-xl text-white font-semibold mb-8 drop-shadow-lg">
              Un duelo, un balón, un solo sobreviviente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowRegistration(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
              >
                <Target className="w-5 h-5 mr-2" />
                Registrarse - $100 MXN
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
                onClick={() => document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver Partidos
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Registro Modal */}
        {showRegistration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Registro WildBrowl 1v1
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div>
                    <Label>Nombre del Jugador</Label>
                    <Input
                      value={registrationForm.player_name}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, player_name: e.target.value })}
                      required
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={registrationForm.email}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={registrationForm.phone}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                      required
                      placeholder="618-123-4567"
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <select
                      value={registrationForm.category}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, category: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="varonil">Varonil</option>
                      <option value="femenil">Femenil</option>
                    </select>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-900">Costo de Inscripción</span>
                    </div>
                    <p className="text-orange-800 text-sm">
                      <strong>$100 MXN</strong> por jugador - Pago seguro con MercadoPago
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegistration(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={registering} className="flex-1 bg-orange-600 hover:bg-orange-700">
                      {registering ? "Procesando..." : "Registrar y Pagar"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* EN VIVO */}
        {liveMatches.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                EN VIVO
              </h2>
              <p className="text-white/80 text-lg">Enfrentamientos 1v1 que se están jugando ahora</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-red-50 border-red-200 hover:bg-red-100 transition-all transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge className="mb-4 bg-red-500 text-white animate-pulse">🔴 EN VIVO</Badge>
                      <h3 className="text-gray-900 font-bold text-xl mb-4">
                        {match.player1} vs {match.player2}
                      </h3>
                      <div className="text-4xl font-bold text-gray-900 mb-4">
                        {match.player1_score || 0} - {match.player2_score || 0}
                      </div>
                      <div className="space-y-2 text-gray-600 text-sm">
                        <div className="flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {match.venue} - {match.field}
                        </div>
                        <div className="flex items-center justify-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {match.game_time}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Próximos Enfrentamientos */}
        <section id="matches" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <Calendar className="w-10 h-10 mr-3 text-orange-400" />
              Próximos Enfrentamientos
            </h2>
            <p className="text-white/80 text-lg">Los duelos 1v1 más esperados</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge className="mb-4 bg-orange-600">{match.round}</Badge>
                      <h3 className="text-white font-bold text-xl mb-4">
                        {match.player1} vs {match.player2}
                      </h3>
                      <div className="space-y-3 text-white/80 text-sm">
                        <div className="flex items-center justify-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(match.game_date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center justify-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {match.game_time}
                        </div>
                        <div className="flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {match.venue} - {match.field}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Target className="w-16 h-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No hay enfrentamientos programados</h3>
                <p className="text-white/70">Los duelos aparecerán aquí una vez que se programen.</p>
              </div>
            )}
          </div>
        </section>

        {/* Resultados Recientes */}
        {recentMatches.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                <Trophy className="w-10 h-10 mr-3 text-yellow-400" />
                Resultados Recientes
              </h2>
              <p className="text-white/80 text-lg">Los últimos enfrentamientos finalizados</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMatches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge className="mb-4 bg-green-600">Finalizado</Badge>
                      <h3 className="text-white font-bold text-xl mb-2">
                        {match.player1} vs {match.player2}
                      </h3>
                      <div className="text-4xl font-bold text-white mb-4">
                        {match.player1_score} - {match.player2_score}
                      </div>
                      <div className="space-y-2 text-white/70 text-sm">
                        <div className="flex items-center justify-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(match.game_date).toLocaleDateString("es-ES")}
                        </div>
                        <div className="flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {match.venue} - {match.field}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Participantes */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <Users className="w-10 h-10 mr-3 text-purple-400" />
              Participantes Registrados
            </h2>
            <p className="text-white/80 text-lg">{participants.filter((p) => p.paid).length} jugadores confirmados</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {participants
              .filter((p) => p.paid)
              .map((participant) => (
                <Card key={participant.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                      {participant.player_name.charAt(0)}
                    </div>
                    <h4 className="text-white font-semibold">{participant.player_name}</h4>
                    <Badge className="mt-2" variant={participant.category === "varonil" ? "default" : "secondary"}>
                      {participant.category === "varonil" ? "Varonil" : "Femenil"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>

        {/* Información del Torneo */}
        <section className="mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">Información del Torneo</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Formato del Torneo</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• Eliminación directa</li>
                  <li>• Partidos de 10 minutos</li>
                  <li>• Campo reducido</li>
                  <li>• Categorías: Varonil y Femenil</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Premiación</h3>
                <ul className="text-white/80 space-y-2">
                  <li>🥇 Campeón: Trofeo + Premio</li>
                  <li>🥈 Subcampeón: Medalla</li>
                  <li>🥉 3er Lugar: Medalla</li>
                  <li>⭐ Reconocimientos especiales</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
