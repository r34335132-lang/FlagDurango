import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Configurar VAPID keys
webpush.setVapidDetails(
  "mailto:admin@ligaflagdurango.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { title, body, url, gameId } = await request.json()

    console.log("Sending notification:", { title, body, url, gameId })

    if (!title || !body) {
      return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 })
    }

    // Verificar configuración VAPID
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured")
      return NextResponse.json({ success: false, error: "VAPID keys not configured" }, { status: 500 })
    }

    // Obtener todas las suscripciones activas
    const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*")

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Database error: " + error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found")
      return NextResponse.json({
        success: false,
        error: "No hay suscripciones activas",
      })
    }

    console.log(`Found ${subscriptions.length} subscriptions`)

    // Preparar el payload de la notificación
    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      image: "/imagenes/20años.png",
      data: {
        url: url || "/partidos",
        gameId,
        timestamp: Date.now(),
      },
      actions: [
        {
          action: "view",
          title: "Ver",
          icon: "/icons/icon-96x96.png",
        },
        {
          action: "close",
          title: "Cerrar",
        },
      ],
      requireInteraction: true,
      tag: gameId ? `game-${gameId}` : `notification-${Date.now()}`,
      vibrate: [200, 100, 200, 100, 200],
    })

    console.log("Notification payload prepared")

    // Enviar notificaciones a todas las suscripciones
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        console.log(`Sending to: ${sub.endpoint.substring(0, 50)}...`)

        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 86400, // 24 horas
          urgency: "high",
          topic: gameId ? `game-${gameId}` : "general",
        })

        console.log("✅ Notification sent successfully")
        return { success: true, endpoint: sub.endpoint }
      } catch (error: any) {
        console.error(`❌ Error sending to ${sub.endpoint.substring(0, 50)}...:`, error.message)

        // Si la suscripción es inválida (410 Gone, 404 Not Found), eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log("🗑️ Removing invalid subscription")
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        }

        return {
          success: false,
          endpoint: sub.endpoint,
          error: error.message,
          statusCode: error.statusCode,
        }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`📊 Results: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`,
      results: {
        successful,
        failed,
        total: subscriptions.length,
        details: results,
      },
    })
  } catch (error) {
    console.error("💥 Error in send route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
