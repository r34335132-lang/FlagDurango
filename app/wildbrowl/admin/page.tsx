"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Target, Play, Calendar } from 'lucide-react'

interface Participant {
  id: number
  user_id?: number | null
  name: string
  alias?: string | null
  category?: string | null
  status?: string | null
}

interface WBMatch {
  id: number
  player_a: string
  player_b: string
  scheduled_date?: string | null
  scheduled_time?: string | null
  status: string
  score_a?: number | null
  score_b?: number | null
  round?: string | null
}

export default function WildBrowlAdmin() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<WBMatch[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/wildbrowl/participants"),
        fetch("/api/wildbrowl/matches"),
      ])
      const [pData, mData] = await Promise.all([pRes.json(), mRes.json()])
      if (pData.success) setParticipants(pData.data || [])
      if (mData.success) setMatches(mData.data || [])
    } catch (e) {
      console.error("WildBrowl load error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <div className="container mx-auto px-4 py-10">Cargando WildBrowl...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="w-6 h-6" /> WildBrowl 1v1 - Admin</h1>
        <Button onClick={load}>Recargar</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Participantes ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participants.length === 0 ? (
              <div className="text-gray-600">No hay participantes aún.</div>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-semibold">{p.name}{p.alias ? ` (${p.alias})` : ""}</div>
                    <div className="text-xs text-gray-600">{p.category || "sin categoría"}</div>
                  </div>
                  <Badge>{p.status || "registrado"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" /> Partidos ({matches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.length === 0 ? (
              <div className="text-gray-600">No hay partidos programados.</div>
            ) : (
              matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-semibold">{m.player_a} vs {m.player_b}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {m.scheduled_date || "—"} {m.scheduled_time || ""}
                    </div>
                    {m.status === "finalizado" && (
                      <div className="text-sm font-bold">{m.score_a ?? 0} - {m.score_b ?? 0}</div>
                    )}
                  </div>
                  <Badge>{m.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
