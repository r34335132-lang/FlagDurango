import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, email, password } = body

    console.log("📝 Registrando coach:", { username, email })

    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos los campos son requeridos",
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        },
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
      return NextResponse.json(
        {
          success: false,
          message: "El email o nombre de usuario ya está registrado",
        },
        { status: 400 },
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario coach (solo datos básicos)
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        role: "coach",
        status: "pending", // Pendiente hasta que admin lo apruebe
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("❌ Error creando usuario:", userError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear el usuario: " + userError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Coach registrado exitosamente:", newUser.id)

    return NextResponse.json({
      success: true,
      message: "Coach registrado exitosamente. Puedes iniciar sesión ahora.",
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (error: any) {
    console.error("💥 Error en registro de coach:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor: " + error.message,
      },
      { status: 500 },
    )
  }
}
