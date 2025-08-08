import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("coach_permissions")
      .select(
        `
        id, user_id, team_id, can_manage_players, can_upload_logo, can_upload_photos, can_view_stats, approved_by_admin,
        users:users ( username, email ),
        teams:teams ( name, category )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: data || [] })
  } catch {
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
