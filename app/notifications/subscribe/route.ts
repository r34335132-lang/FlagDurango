import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: "Invalid subscription" }, { status: 400 })
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, message: "Subscription already exists" })
    }

    // Insert new subscription
    const { error } = await supabase.from("push_subscriptions").insert({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: request.headers.get("user-agent") || "",
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving subscription:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in subscribe route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, created_at, active")
      .eq("active", true)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscriptions: data?.length || 0,
      message: "Push notification service is running",
    })
  } catch (error) {
    console.error("Error getting subscriptions:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
