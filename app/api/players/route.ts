import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

// GET /api/players?team_id=123
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("team_id")

    const query = supabase.from("players").select("*").order("name", { ascending: true })
    const { data, error } = teamId ? await query.eq("team_id", Number.parseInt(teamId)) : await query

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}

// POST /api/players
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, team_id, position, jersey_number, photo_url = null } = body

    if (!name || !team_id || !position || jersey_number === undefined) {
      return NextResponse.json({ success: false, message: "Nombre, equipo, posición y número son requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("players")
      .insert([{ name, team_id, position, jersey_number, photo_url }])
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}

// PUT /api/players (actualiza foto o datos)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...update } = body
    if (!id) return NextResponse.json({ success: false, message: "ID requerido" }, { status: 400 })

    const { data, error } = await supabase.from("players").update(update).eq("id", id).select().single()
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}
