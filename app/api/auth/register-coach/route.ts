import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Datos recibidos:", body)

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

    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Usuario, email y contraseña son requeridos" },
        { status: 400 },
      )
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`)
      .single()

    if (existingUser) {
      return NextResponse.json({ success: false, message: "El usuario o email ya existe" }, { status: 400 })
    }

    let usedTeamId = team_id
    let createdTeam: any = null

    // Crear equipo si viene team_name
    if (!usedTeamId && team_name) {
      console.log("Creando equipo:", team_name)

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
            paid: false,
          },
        ])
        .select()
        .single()

      if (teamError) {
        console.error("Error creando equipo:", teamError)
        return NextResponse.json(
          { success: false, message: "Error creando equipo: " + teamError.message },
          { status: 500 },
        )
      }

      usedTeamId = team.id
      createdTeam = team
      console.log("Equipo creado:", team)
    }

    // Hash de la contraseña
    let passwordHash: string
    try {
      passwordHash = await bcrypt.hash(password, 10)
    } catch (hashError) {
      console.error("Error hasheando contraseña:", hashError)
      // Fallback: guardar contraseña sin hash (solo para desarrollo)
      passwordHash = password
    }

    const normalizedRole = role === "captain" ? "captain" : "coach"

    // Crear usuario
    console.log("Creando usuario...")
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          role: normalizedRole,
          status: "active",
          password_hash: passwordHash,
        },
      ])
      .select("id, username, email, role, status")
      .single()

    if (userError) {
      console.error("Error creando usuario:", userError)
      return NextResponse.json(
        { success: false, message: "Error creando usuario: " + userError.message },
        { status: 500 },
      )
    }

    console.log("Usuario creado:", user)

    // Crear permisos de coach solo si hay team_id
    let perm = null
    if (usedTeamId) {
      const { data: permData, error: permError } = await supabase
        .from("coach_permissions")
        .insert([
          {
            user_id: user.id,
            team_id: usedTeamId,
            can_manage_players: true,
            can_upload_logo: true,
            can_upload_photos: true,
            can_view_stats: true,
            approved_by_admin: false,
          },
        ])
        .select()
        .single()

      if (permError) {
        console.error("Error creando permisos:", permError)
        // No fallar si no se pueden crear los permisos
      } else {
        perm = permData
        console.log("Permisos creados:", perm)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        permissions: perm,
        team: createdTeam,
      },
      message: "Registro exitoso. Ahora puedes hacer login y pagar la inscripción ($1,900 MXN).",
    })
  } catch (error: any) {
    console.error("Error en register-coach:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor: " + error.message },
      { status: 500 },
    )
  }
}
