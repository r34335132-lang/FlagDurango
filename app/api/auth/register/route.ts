import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validar datos
    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos los campos son requeridos.",
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
          message: "El usuario o email ya existe.",
        },
        { status: 409 },
      )
    }

    // Hash de la contraseña
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insertar usuario directamente en la tabla
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password_hash: passwordHash,
          role: "user",
          status: "active",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear el usuario.",
        },
        { status: 500 },
      )
    }

    // Remover password_hash de la respuesta
    const { password_hash, ...userResponse } = newUser

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente. Ya puedes iniciar sesión.",
      user: userResponse,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor.",
      },
      { status: 500 },
    )
  }
}
