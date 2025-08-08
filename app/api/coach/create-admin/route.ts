import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

// Crea cuenta de entrenador/coach desde Admin, sin pago.
export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()
    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: "Usuario, email y contraseña requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, password, role: "coach", status: "active" }])
      .select("id, username, email, role, status")
      .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}
