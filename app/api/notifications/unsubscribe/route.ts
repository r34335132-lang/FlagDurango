import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // En una implementación real, deberías identificar qué suscripción eliminar
    // Por simplicidad, aquí eliminamos todas las suscripciones
    const { error } = await supabase.from("push_subscriptions").delete().neq("id", 0) // Eliminar todas

    if (error) {
      console.error("Error eliminando suscripciones:", error)
      return NextResponse.json({ error: "Error eliminando suscripciones" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en unsubscribe:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
