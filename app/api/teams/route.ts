import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

// GET /api/teams
// - sin params: lista de equipos
// - ?id=123: ficha completa con jugadores
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const teamId = Number.parseInt(id)
      const { data: team, error: teamErr } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .maybeSingle()

      if (teamErr) return NextResponse.json({ success: false, message: teamErr.message }, { status: 500 })
      if (!team) return NextResponse.json({ success: false, message: "Equipo no encontrado" }, { status: 404 })

      const { data: players, error: plErr } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId)
        .order("jersey_number", { ascending: true })

      if (plErr) return NextResponse.json({ success: false, message: plErr.message }, { status: 500 })

      return NextResponse.json({ success: true, data: { team, players: players || [] } })
    }

    const { data, error } = await supabase.from("teams").select("*").order("name", { ascending: true })
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}

// POST /api/teams
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      category,
      color1,
      color2,
      logo_url,
      is_institutional,
      coordinator_name,
      coordinator_phone,
      captain_photo_url,
      // Campos opcionales nuevos: solo los incluimos si vienen en el body
      captain_name,
      captain_phone,
      coach_name,
      coach_phone,
      coach_photo_url,
    } = body

    if (!name || !category) {
      return NextResponse.json({ success: false, message: "Nombre y categoría son requeridos" }, { status: 400 })
    }

    const base: any = {
      name,
      category,
      color1: color1 || "#3B82F6",
      color2: color2 || "#1E40AF",
      logo_url: logo_url || null,
      is_institutional: Boolean(is_institutional),
      coordinator_name: coordinator_name || null,
      coordinator_phone: coordinator_phone || null,
      captain_photo_url: captain_photo_url || null,
    }

    // Solo agrega los nuevos campos si vienen definidos en el body,
    // evitando errores en DB que aún no tiene esas columnas.
    if (captain_name !== undefined) base.captain_name = captain_name
    if (captain_phone !== undefined) base.captain_phone = captain_phone
    if (coach_name !== undefined) base.coach_name = coach_name
    if (coach_phone !== undefined) base.coach_phone = coach_phone
    if (coach_photo_url !== undefined) base.coach_photo_url = coach_photo_url

    const { data, error } = await supabase.from("teams").insert([base]).select().single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/teams?id=123
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, message: "ID requerido" }, { status: 400 })

    const { error } = await supabase.from("teams").delete().eq("id", Number.parseInt(id))
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: "Equipo eliminado" })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}
