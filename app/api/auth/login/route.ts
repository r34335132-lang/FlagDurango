import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario y contraseña son requeridos.",
        },
        { status: 400 },
      )
    }

    // Buscar usuario por username o email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${username},email.eq.${username}`)
      .single()

    if (error || !user) {
      console.log("Usuario no encontrado:", { username, error })
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no encontrado.",
        },
        { status: 401 },
      )
    }

    // Verificar contraseña
    let isValidPassword = false

    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    } catch (bcryptError) {
      console.error("Error en bcrypt.compare:", bcryptError)
      // Fallback: comparación directa (solo para debug)
      isValidPassword = password === user.password_hash
    }

    if (!isValidPassword) {
      console.log("Contraseña incorrecta para usuario:", username)
      return NextResponse.json(
        {
          success: false,
          message: "Contraseña incorrecta.",
        },
        { status: 401 },
      )
    }

    // Verificar que el usuario esté activo
    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario inactivo. Contacta al administrador.",
        },
        { status: 401 },
      )
    }

    // Remover password_hash de la respuesta
    const { password_hash, ...userResponse } = user

    console.log("Login exitoso para:", username, "con rol:", user.role)

    // Crear la respuesta con headers para establecer la cookie
    const response = NextResponse.json({
      success: true,
      message: "Login exitoso.",
      user: userResponse,
      redirectTo: "/admin", // Cambiar redirección a /admin
    })

    // Establecer cookie para el middleware
    const userData = JSON.stringify(userResponse)
    response.cookies.set("user", userData, {
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor.",
      },
      { status: 500 },
    )
  }
}
