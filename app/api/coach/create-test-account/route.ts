import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { username, email, team_id, team_name } = await req.json()
    if (!username || !email) {
      return NextResponse.json({ success: false, message: "username y email son requeridos" }, { status: 400 })
    }

    // Create team if needed
    let usedTeamId = team_id
    if (!usedTeamId) {
      if (!team_name) {
        return NextResponse.json({ success: false, message: "team_id o team_name requerido" }, { status: 400 })
      }
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([{ name: team_name, category: "varonil-gold", color1: "#3B82F6", color2: "#1E40AF" }])
        .select()
        .single()
      if (teamError) return NextResponse.json({ success: false, message: teamError.message }, { status: 500 })
      usedTeamId = team.id
    }

    // Create user with default password
    const password = "Test1234!"
    const hash = await bcrypt.hash(password, 10)
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([{ username, email, role: "coach", status: "active", password_hash: hash }])
      .select()
      .single()
    if (userError) return NextResponse.json({ success: false, message: userError.message }, { status: 500 })

    // Permissions (approved)
    const { data: perm, error: permError } = await supabase
      .from("coach_permissions")
      .insert([
        {
          user_id: user.id,
          team_id: usedTeamId,
          can_manage_players: true,
          can_upload_logo: true,
          can_upload_photos: true,
          can_view_stats: true,
          approved_by_admin: true,
        },
      ])
      .select()
      .single()
    if (permError) return NextResponse.json({ success: false, message: permError.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      data: { user, permissions: perm, password },
      message: "Cuenta de entrenador de prueba creada",
    })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
