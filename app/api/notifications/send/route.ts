import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Configurar VAPID
webpush.setVapidDetails(
  "mailto:admin@ligaflagdurango.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    console.log("Enviando notificación:", message)

    // Obtener todas las suscripciones
    const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*")

    if (error) {
      console.error("Error obteniendo suscripciones:", error)
      return NextResponse.json({ error: "Error obteniendo suscripciones" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: "No hay suscripciones activas" }, { status: 400 })
    }

    // Enviar notificación a todas las suscripciones
    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: "Liga Flag Durango",
            body: message,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-72x72.png",
            data: {
              url: "/",
              timestamp: Date.now(),
            },
          }),
        )
        console.log("Notificación enviada a:", sub.endpoint)
      } catch (error) {
        console.error("Error enviando a suscripción:", error)
        // Eliminar suscripción inválida
        await supabase.from("push_subscriptions").delete().eq("id", sub.id)
      }
    })

    await Promise.all(promises)

    return NextResponse.json({ success: true, sent: subscriptions.length })
  } catch (error) {
    console.error("Error en send:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
