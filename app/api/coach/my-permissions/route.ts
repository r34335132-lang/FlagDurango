import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const user_id = searchParams.get("user_id")

    if (!email && !user_id) {
      return NextResponse.json({ success: false, message: "email o user_id requerido" }, { status: 400 })
    }

    const query = supabase
      .from("coach_permissions")
      .select(
        `
        id, user_id, team_id, can_manage_players, can_upload_logo, can_upload_photos, can_view_stats, approved_by_admin,
        users:users ( id, username, email ),
        teams:teams ( id, name, category, color1, color2, logo_url )
      `,
      )
      .limit(1)

    if (email) {
      query.eq("users.email", email)
    } else if (user_id) {
      query.eq("user_id", user_id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: data?.[0] || null })
  } catch {
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
