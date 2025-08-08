"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Role = "coach" | "captain"

export default function RegisterTeamPage() {
  const [role, setRole] = useState<Role>("coach")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState({ username: "", email: "", password: "" })
  const [team, setTeam] = useState({
    name: "",
    category: "varonil-gold",
    logo_url: "",
    is_institutional: false,
    coordinator_name: "",
    coordinator_phone: "",
    captain_photo_url: "",
  })

  const register = async () => {
    if (!user.email || !user.password || !user.username || !team.name) {
      alert("Completa todos los campos obligatorios")
      return
    }
    setLoading(true)
    try {
      // 1) Crear cuenta (rol: coach/captain)
      const ures = await fetch("/api/auth/register-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, role }),
      })
      const ujson = await ures.json()
      if (!ujson.success) {
        alert(ujson.message || "Error al crear usuario")
        setLoading(false)
        return
      }

      // 2) Crear equipo
      const tres = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      })
      const tjson = await tres.json()
      if (!tjson.success) {
        alert(tjson.message || "Error al crear equipo")
        setLoading(false)
        return
      }

      // 3) Mercado Pago preference para $1900 MXN
      const prefRes = await fetch("/api/payments/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Inscripción Liga Flag - ${team.name}`,
          quantity: 1,
          unit_price: 1900,
          team_id: tjson.data.id,
        }),
      })
      const prefJson = await prefRes.json()
      if (!prefJson.success) {
        alert(prefJson.message || "Error creando preferencia de pago")
        setLoading(false)
        return
      }

      // Redirigir al checkout (si sandbox, igual da un link útil)
      const initPoint = prefJson.init_point || prefJson.data?.init_point
      if (initPoint) {
        window.location.href = initPoint
      } else {
        alert("Preferencia creada, pero no se recibió link de pago.")
      }
    } catch (e) {
      console.error(e)
      alert("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Registro de {role === "coach" ? "Entrenador/Coach" : "Capitán"} y Equipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button variant={role === "coach" ? "default" : "outline"} onClick={() => setRole("coach")}>
              Coach <Badge className="ml-2">Recomendado</Badge>
            </Button>
            <Button variant={role === "captain" ? "default" : "outline"} onClick={() => setRole("captain")}>
              Capitán
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Usuario</Label>
              <Input value={user.username} onChange={(e) => setUser((s) => ({ ...s, username: e.target.value }))} placeholder="Usuario" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={user.email} onChange={(e) => setUser((s) => ({ ...s, email: e.target.value }))} placeholder="correo@dominio.com" />
            </div>
            <div className="md:col-span-2">
              <Label>Contraseña</Label>
              <Input type="password" value={user.password} onChange={(e) => setUser((s) => ({ ...s, password: e.target.value }))} placeholder="********" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del equipo</Label>
              <Input value={team.name} onChange={(e) => setTeam((s) => ({ ...s, name: e.target.value }))} placeholder="Nombre" />
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="w-full h-10 rounded-md border px-3"
                value={team.category}
                onChange={(e) => setTeam((s) => ({ ...s, category: e.target.value }))}
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
            <div>
              <Label>Logo URL</Label>
              <Input value={team.logo_url} onChange={(e) => setTeam((s) => ({ ...s, logo_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Foto del capitán (opcional)</Label>
              <Input value={team.captain_photo_url} onChange={(e) => setTeam((s) => ({ ...s, captain_photo_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de equipo</Label>
              <select
                className="w-full h-10 rounded-md border px-3"
                value={team.is_institutional ? "institucional" : "particular"}
                onChange={(e) => setTeam((s) => ({ ...s, is_institutional: e.target.value === "institucional" }))}
              >
                <option value="particular">Particular</option>
                <option value="institucional">Institucional</option>
              </select>
            </div>
            <div />
            {team.is_institutional && (
              <>
                <div>
                  <Label>Nombre del coordinador educativo</Label>
                  <Input value={team.coordinator_name} onChange={(e) => setTeam((s) => ({ ...s, coordinator_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Teléfono del coordinador</Label>
                  <Input value={team.coordinator_phone} onChange={(e) => setTeam((s) => ({ ...s, coordinator_phone: e.target.value }))} />
                </div>
              </>
            )}
          </div>

          <Button onClick={register} disabled={loading} className="w-full">
            {loading ? "Procesando..." : "Registrar y Pagar $1900 MXN"}
          </Button>
          <div className="text-xs text-neutral-500">
            ¿Otro equipo? Repite el registro para generar un nuevo pago.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
