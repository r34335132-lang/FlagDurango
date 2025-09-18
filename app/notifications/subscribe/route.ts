import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: "Invalid subscription object" }, { status: 400 })
    }

    // Save subscription to database
    const { data, error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        user_agent: request.headers.get("user-agent") || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
      },
      {
        onConflict: "endpoint",
      },
    )

    if (error) {
      console.error("Error saving subscription:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Push subscription saved successfully:", subscription.endpoint)

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
      data,
    })
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
