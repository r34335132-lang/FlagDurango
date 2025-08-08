"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

type ConfigItem = { config_key: string; config_value: string; description?: string }

export default function AdminConfigPage() {
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wildEnabled, setWildEnabled] = useState(false)
  const [deadline, setDeadline] = useState("2025-09-15")
  const [seasonStarted, setSeasonStarted] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/system-config")
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
        const map: Record<string, string> = {}
        data.data.forEach((c: ConfigItem) => (map[c.config_key] = c.config_value))
        setWildEnabled(map["wildbrowl_enabled"] === "true")
        setDeadline(map["registration_deadline"] || "2025-09-15")
        setSeasonStarted(map["season_started"] === "true")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveConfig = async (key: string, value: string) => {
    const res = await fetch("/api/system-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config_key: key, config_value: value }),
    })
    return res.json()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        saveConfig("wildbrowl_enabled", wildEnabled ? "true" : "false"),
        saveConfig("registration_deadline", deadline),
        saveConfig("season_started", seasonStarted ? "true" : "false"),
      ])
      alert("Configuración guardada")
    } catch (e) {
      alert("Error guardando configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando configuración...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/admin" className="text-blue-600 underline">{'←'} Volver al Admin</Link>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Configuración del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="wild">Activar WildBrowl 1v1</Label>
              <input
                id="wild"
                type="checkbox"
                checked={wildEnabled}
                onChange={(e) => setWildEnabled(e.target.checked)}
              />
            </div>

            <div>
              <Label htmlFor="deadline">Fecha Límite de Inscripción</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="season">Temporada Iniciada</Label>
              <input
                id="season"
                type="checkbox"
                checked={seasonStarted}
                onChange={(e) => setSeasonStarted(e.target.checked)}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
