import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const season = searchParams.get("season") || "2025"
    const category = searchParams.get("category")
    const week = searchParams.get("week") ? Number(searchParams.get("week")) : undefined
    const type = searchParams.get("type") || "weekly"

    let query = supabase.from("mvps").select("id, player_id, season, category, week_number, mvp_type, notes, created_at")
      .eq("season", season)
      .eq("mvp_type", type)

    if (category) query = query.eq("category", category)
    if (week !== undefined) query = query.eq("week_number", week)

    const { data, error } = await query.order("created_at", { ascending: false })
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error("GET /api/mvps error:", error)
    return NextResponse.json({ success: false, message: error.message || "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { player_id, season = "2025", category, week_number, mvp_type = "weekly", notes } = await request.json()

    if (!player_id || !category) {
      return NextResponse.json({ success: false, message: "player_id y category son requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("mvps")
      .insert([{ player_id, season, category, week_number: week_number || null, mvp_type, notes: notes || null }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("POST /api/mvps error:", error)
    return NextResponse.json({ success: false, message: error.message || "Error interno" }, { status: 500 })
  }
}
