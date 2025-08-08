import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      role = "coach",
      username,
      email,
      password,
      team_id,
      team_name,
      category = "varonil-gold",
      logo_url,
      color1 = "#3B82F6",
      color2 = "#1E40AF",
      is_institutional = false,
      coordinator_name = null,
      coordinator_phone = null,
      captain_name = null,
      captain_phone = null,
      captain_photo_url = null,
    } = body

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: "Usuario, email y contraseña requeridos" }, { status: 400 })
    }

    // Crear equipo si viene como nombre
    let usedTeamId = team_id
    let createdTeam: any = null
    if (!usedTeamId && team_name) {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            name: team_name,
            category,
            logo_url: logo_url || null,
            color1,
            color2,
            is_institutional: Boolean(is_institutional),
            coordinator_name,
            coordinator_phone,
            captain_name,
            captain_phone,
            captain_photo_url,
            status: "active",
          },
        ])
        .select()
        .single()
      if (teamError) return NextResponse.json({ success: false, message: teamError.message }, { status: 500 })
      usedTeamId = team.id
      createdTeam = team
    }

    const hash = await bcrypt.hash(password, 10)
    const normalizedRole = role === "captain" ? "captain" : "coach"

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([{ username, email, role: normalizedRole, status: "active", password_hash: hash }])
      .select("id, username, email, role, status")
      .single()
    if (userError) return NextResponse.json({ success: false, message: userError.message }, { status: 500 })

    const { data: perm, error: permError } = await supabase
      .from("coach_permissions")
      .insert([
        {
          user_id: user.id,
          team_id: usedTeamId || null,
          can_manage_players: true,
          can_upload_logo: true,
          can_upload_photos: true,
          can_view_stats: true,
          approved_by_admin: false,
        },
      ])
      .select()
      .single()
    if (permError) return NextResponse.json({ success: false, message: permError.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      data: { user, permissions: perm, team: createdTeam },
      message: "Registro exitoso. Paga la inscripción y espera aprobación del administrador.",
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || "Error interno del servidor" }, { status: 500 })
  }
}
