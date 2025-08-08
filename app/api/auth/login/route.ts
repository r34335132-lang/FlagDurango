import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    // Tu payload original aceptaba username; agrego soporte a identifier y email
    const body = await request.json()
    const username: string | undefined = body?.username
    const email: string | undefined = body?.email
    const identifier: string | undefined = body?.identifier
    const password: string | undefined = body?.password

    const id = (identifier ?? username ?? email)?.trim()

    if (!id || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario y contraseña son requeridos.",
        },
        { status: 400 },
      )
    }

    // Buscar usuario por username O email (exacto, como en tu versión)
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${id},email.eq.${id}`)
      .single()

    if (error || !user) {
      console.log("Usuario no encontrado:", { id, error })
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no encontrado.",
        },
        { status: 401 },
      )
    }

    // Verificar contraseña: primero hash, si no coincide, fallback a texto plano para datos antiguos
    let isValidPassword = false
    try {
      if (user.password_hash) {
        isValidPassword = await bcrypt.compare(password, user.password_hash)
      }
    } catch (bcryptError) {
      console.error("Error en bcrypt.compare:", bcryptError)
      isValidPassword = false
    }
    if (!isValidPassword) {
      // Fallback: si tuvieras columna 'password' en texto plano (datos viejos)
      if (user.password && password === user.password) {
        isValidPassword = true
      }
    }

    if (!isValidPassword) {
      console.log("Contraseña incorrecta para usuario:", id)
      return NextResponse.json(
        {
          success: false,
          message: "Contraseña incorrecta.",
        },
        { status: 401 },
      )
    }

    // Verificar status activo (igual a tu versión)
    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario inactivo. Contacta al administrador.",
        },
        { status: 401 },
      )
    }

    // Construir redirección por rol
    const role: string = user.role || "user"
    const redirectTo =
      role === "admin"
        ? "/admin"
        : role === "coach" || role === "capitan"
        ? "/coach-dashboard"
        : role === "referee"
        ? "/referee-dashboard"
        : role === "staff"
        ? "/staff"
        : "/"

    // Sugerencia de registro de equipo (para coach/capitan)
    const registerTeamUrl = role === "coach" || role === "capitan" ? "/register-team" : null

    // Remover password_hash de la respuesta
    const { password_hash, password: _plain, ...userResponse } = user

    console.log("Login exitoso para:", id, "con rol:", role)

    // Respuesta con redirectTo por rol
    const response = NextResponse.json({
      success: true,
      message: "Login exitoso.",
      user: userResponse,
      redirectTo,
      registerTeamUrl,
    })

    // Cookie para middleware/cliente
    const userData = JSON.stringify(userResponse)
    response.cookies.set("user", userData, {
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
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
