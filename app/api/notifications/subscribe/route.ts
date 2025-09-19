import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    console.log("Recibida suscripción:", subscription)

    // Guardar en la base de datos
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error guardando suscripción:", error)
      return NextResponse.json({ error: "Error guardando suscripción" }, { status: 500 })
    }

    console.log("Suscripción guardada:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error en subscribe:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
