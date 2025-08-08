import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

type MVPRow = {
  id: number
  mvp_type: string
  category: string
  week_number?: number | null
  season?: string | null
  notes?: string | null
  created_at: string
  player?: {
    id: number
    name: string
    photo_url?: string | null
    team_id?: number | null
    team?: { id: number; name: string; logo_url?: string | null } | null
  } | null
}

export async function GET() {
  try {
    // 1) Intentar leer desde "mvps"
    const { data: mvpsData, error: mvpsError } = await supabase
      .from("mvps")
      .select(`
        id, mvp_type, category, week_number, season, notes, created_at,
        player:players (
          id, name, photo_url, team_id,
          team:teams ( id, name, logo_url )
        )
      `)
      .eq("mvp_type", "weekly")
      .order("created_at", { ascending: false })
      .limit(12)

    if (mvpsError) {
      console.warn("mvps table error, will try fallback:", mvpsError.message)
    }

    if (mvpsData && mvpsData.length > 0) {
      return NextResponse.json({ success: true, data: mvpsData as MVPRow[] })
    }

    // 2) Fallback: intentar leer desde "individual_mvps"
    const { data: indData, error: indError } = await supabase
      .from("individual_mvps")
      .select(`
        id, mvp_type, category, week_number, season, notes, created_at,
        player:players (
          id, name, photo_url, team_id,
          team:teams ( id, name, logo_url )
        )
      `)
      .eq("mvp_type", "weekly")
      .order("created_at", { ascending: false })
      .limit(12)

    if (indError) {
      console.error("individual_mvps GET error:", indError)
      return NextResponse.json({ success: false, error: indError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: (indData || []) as MVPRow[] })
  } catch (e) {
    console.error("MVP weekly GET exception:", e)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
