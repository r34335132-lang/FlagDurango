import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const season = searchParams.get("season") || "2025"

    let query = supabase
      .from("mvps")
      .select(`
        id,
        mvp_type,
        category,
        week_number,
        season,
        notes,
        created_at,
        players!inner(
          id,
          name,
          photo_url,
          team_id,
          teams!players_team_id_fkey(
            id,
            name,
            logo_url,
            color1,
            color2
          )
        )
      `)
      .eq("mvp_type", "weekly")
      .eq("season", season)

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching weekly MVPs:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error("GET /api/mvps/weekly error:", error)
    return NextResponse.json({ success: false, message: error.message || "Error interno" }, { status: 500 })
  }
}
