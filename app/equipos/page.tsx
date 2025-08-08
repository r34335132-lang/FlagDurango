"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Phone, ArrowRight } from 'lucide-react'
import Link from "next/link"

interface Player {
  id: number
  name: string
  position: string
  jersey_number: number
  photo_url?: string | null
}

interface Team {
  id: number
  name: string
  category: string
  color1: string
  color2: string
  logo_url?: string | null
  captain_name?: string | null
  captain_phone?: string | null
  players?: Player[]
  is_institutional?: boolean
  coordinator_name?: string | null
  coordinator_phone?: string | null
  captain_photo_url?: string | null
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const loadTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      const data = await response.json()
      if (data.success) setTeams(data.data || [])
    } catch {
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const categories = [
    { value: "all", label: "Todas las Categorías" },
    { value: "varonil-gold", label: "Varonil Gold" },
    { value: "varonil-silver", label: "Varonil Silver" },
    { value: "femenil-gold", label: "Femenil Gold" },
    { value: "femenil-silver", label: "Femenil Silver" },
    { value: "femenil-cooper", label: "Femenil Cooper" },
    { value: "mixto-gold", label: "Mixto Gold" },
    { value: "mixto-silver", label: "Mixto Silver" },
  ]

  const filteredTeams = selectedCategory === "all" ? teams : teams.filter((team) => team.category === selectedCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "varonil-gold":
        return "bg-yellow-600"
      case "varonil-silver":
        return "bg-gray-400"
      case "femenil-gold":
        return "bg-pink-600"
      case "femenil-silver":
        return "bg-pink-400"
      case "femenil-cooper":
        return "bg-rose-500"
      case "mixto-gold":
        return "bg-orange-600"
      case "mixto-silver":
        return "bg-orange-400"
      default:
        return "bg-blue-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando equipos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Equipos</h1>
          <div className="text-white">
            <div className="text-2xl font-bold">{filteredTeams.length}</div>
            <div className="text-sm opacity-70">equipos registrados</div>
          </div>
        </div>

        {/* Filtro por categoría */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={selectedCategory === category.value ? "bg-white text-black" : ""}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid de equipos */}
        {filteredTeams.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h3 className="text-white text-xl font-semibold mb-2">No hay equipos registrados</h3>
              <p className="text-white/70">
                {selectedCategory === "all"
                  ? "Aún no se han registrado equipos en la liga."
                  : `No hay equipos registrados en la categoría seleccionada.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <Link key={team.id} href={`/equipos/${team.id}`}>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${team.color1}, ${team.color2})` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {team.logo_url ? (
                          <img
                            src={team.logo_url || "/placeholder.svg?height=64&width=64&query=logo%20equipo"}
                            alt={team.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          team.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl">{team.name}</CardTitle>
                        <Badge className={`${getCategoryColor(team.category)} text-white mt-1`}>
                          {team.category.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/70" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {team.captain_name && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-white/90">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Capitán: {team.captain_name}</span>
                        </div>
                        {team.captain_phone && (
                          <div className="flex items-center space-x-2 text-white/70 text-sm mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{team.captain_phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-white/90">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Jugadores</span>
                      </div>
                      <Badge variant="outline" className="text-white border-white/30">
                        {team.players?.length || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
