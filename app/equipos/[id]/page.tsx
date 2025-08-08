"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, User, Shirt } from 'lucide-react'

interface Team {
  id: number
  name: string
  category: string
  color1: string
  color2: string
  logo_url?: string | null
  captain_name?: string | null
  captain_phone?: string | null
  captain_photo_url?: string | null
  coach_name?: string | null
  coach_phone?: string | null
  coach_photo_url?: string | null
}

interface Player {
  id: number
  team_id: number
  name: string
  jersey_number?: number | null
  position?: string | null
}

export default function TeamPage() {
  const params = useParams<{ id: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    const load = async () => {
      try {
        const res = await fetch(`/api/teams?id=${params.id}`)
        const data = await res.json()
        if (data.success) {
          setTeam(data.data.team)
          setPlayers(data.data.players || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.id])

  if (loading) {
    return <div className="container mx-auto px-4 py-10">Cargando equipo...</div>
  }
  if (!team) {
    return <div className="container mx-auto px-4 py-10">Equipo no encontrado.</div>
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: `linear-gradient(to right, ${team.color1}, ${team.color2})` }}
        >
          {team.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <Badge className="mt-1">{team.category}</Badge>
        </div>
      </div>

      {/* Staff */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Capitán</h3>
            <div className="text-sm text-gray-700">
              <div><span className="font-semibold">Nombre:</span> {team.captain_name || "—"}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {team.captain_phone || "—"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Coach</h3>
            <div className="text-sm text-gray-700">
              <div><span className="font-semibold">Nombre:</span> {team.coach_name || "—"}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {team.coach_phone || "—"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Roster</h3>
          {players.length === 0 ? (
            <div className="text-gray-600">Aún no hay jugadores registrados.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((p) => (
                <div key={p.id} className="p-4 rounded border bg-white shadow-sm">
                  <div className="font-semibold mb-1">{p.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Shirt className="w-4 h-4" /> {p.jersey_number ?? "—"} • {p.position || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
