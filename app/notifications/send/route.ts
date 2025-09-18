import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:admin@ligaflagdurango.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { title, body, url, gameId } = await request.json()

    console.log("Send notification request:", { title, body, url, gameId })

    if (!title || !body) {
      return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 })
    }

    // Verificar configuración VAPID
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured")
      return NextResponse.json({ success: false, error: "VAPID keys not configured" }, { status: 500 })
    }

    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*")

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscriptions found",
      })
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: {
        url: url || "/partidos",
        gameId,
        timestamp: Date.now(),
      },
      actions: [
        {
          action: "view",
          title: "Ver partido",
          icon: "/icons/icon-96x96.png",
        },
      ],
      requireInteraction: true,
      tag: gameId ? `game-${gameId}` : "notification",
    })

    console.log("Notification payload:", payload)

    // Send notifications to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }

        console.log("Sending to endpoint:", subscription.endpoint.substring(0, 50) + "...")

        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, endpoint: subscription.endpoint }
      } catch (error: any) {
        console.error(`Failed to send notification to ${subscription.endpoint}:`, error)

        // If subscription is invalid, remove it from database
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log("Removing invalid subscription:", subscription.endpoint)
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)
        }

        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Notification results: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Notifications sent: ${successful} successful, ${failed} failed`,
      results,
    })
  } catch (error) {
    console.error("Error in send notification route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
