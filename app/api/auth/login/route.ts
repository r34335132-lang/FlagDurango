import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log("Intentando login con:", email)

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Buscar usuario por email o username
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email},username.eq.${email}`)
      .single()

    if (error || !user) {
      console.log("Usuario no encontrado:", error)
      return NextResponse.json({ success: false, message: "Credenciales inválidas" }, { status: 401 })
    }

    console.log("Usuario encontrado:", user.username, "Role:", user.role)

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      console.log("Contraseña inválida")
      return NextResponse.json({ success: false, message: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar estado del usuario
    if (user.status !== "active") {
      return NextResponse.json({ success: false, message: "Usuario inactivo" }, { status: 401 })
    }

    console.log("Login exitoso para:", email, "con rol:", user.role)

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })

    // Establecer cookie para el middleware
    response.cookies.set(
      "auth-token",
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      },
    )

    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
