import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { participant1_id, participant2_id, stage = "regular", round_label = "Round of 32", match_date, venue, field } =
      body

    if (!participant1_id || !participant2_id) {
      return NextResponse.json({ success: false, message: "Faltan participantes" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("wildbrowl_matches")
      .insert([{ participant1_id, participant2_id, stage, round_label, match_date, venue, field }])
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
