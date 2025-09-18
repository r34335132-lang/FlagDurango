import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:admin@ligaflagdurango.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f53NlqKOYWsSBhjuXPiQfzuVAl9Hs4HcKSVdJiKz0g5JwQw5Y8g",
  process.env.VAPID_PRIVATE_KEY || "your-private-key-here",
)

export async function POST(request: NextRequest) {
  try {
    const { title, body, url, gameId } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 })
    }

    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*")

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions" })
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
      tag: `game-${gameId}`,
    })

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

        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, endpoint: subscription.endpoint }
      } catch (error) {
        console.error(`Failed to send notification to ${subscription.endpoint}:`, error)

        // If subscription is invalid, remove it from database
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)
        }

        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

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
