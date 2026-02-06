import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("team_id")
    const coachId = searchParams.get("coach_id")

    let query = supabase.from("coach_championships").select("*").order("year", { ascending: false })

    if (teamId) query = query.eq("team_id", Number(teamId))
    if (coachId) query = query.eq("coach_id", Number(coachId))

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const body = await request.json()
    const { team_id, coach_id, title, year, tournament, position, description } = body

    if (!team_id || !coach_id || !title || !year) {
      return NextResponse.json({ success: false, message: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("coach_championships")
      .insert({ team_id, coach_id, title, year, tournament, position, description })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID requerido" }, { status: 400 })
    }

    const { error } = await supabase.from("coach_championships").delete().eq("id", Number(id))
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}
