import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    console.log("🔍 Testing login for:", { username, password })

    // Buscar usuario
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${username},email.eq.${username}`)
      .single()

    console.log(
      "👤 User found:",
      user ? { id: user.id, username: user.username, role: user.role, status: user.status } : "No user found",
    )
    console.log("❌ Database error:", error)

    if (error || !user) {
      return NextResponse.json({
        success: false,
        message: "Usuario no encontrado",
        debug: { error, searchTerm: username },
      })
    }

    // Verificar contraseña
    console.log("🔐 Comparing passwords...")
    console.log("Input password:", password)
    console.log("Stored hash:", user.password_hash)

    let isValidPassword = false
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
      console.log("✅ bcrypt.compare result:", isValidPassword)
    } catch (bcryptError) {
      console.error("❌ bcrypt error:", bcryptError)
      // Fallback para testing
      isValidPassword = password === user.password_hash
      console.log("🔄 Fallback comparison result:", isValidPassword)
    }

    return NextResponse.json({
      success: isValidPassword,
      message: isValidPassword ? "Login exitoso" : "Contraseña incorrecta",
      debug: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        passwordMatch: isValidPassword,
        inputPassword: password,
        storedHash: user.password_hash,
      },
    })
  } catch (error) {
    console.error("💥 Test login error:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
      debug: { error: error.message },
    })
  }
}
