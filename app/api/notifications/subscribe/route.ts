import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()

    console.log("Received subscription:", {
      endpoint: subscription.endpoint?.substring(0, 50) + "...",
      keys: subscription.keys ? "present" : "missing",
    })

    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ success: false, error: "Invalid subscription data" }, { status: 400 })
    }

    // Verificar si ya existe esta suscripción
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existing) {
      console.log("Subscription already exists")
      return NextResponse.json({ success: true, message: "Subscription already exists" })
    }

    // Insertar nueva suscripción
    const { data, error } = await supabase
      .from("push_subscriptions")
      .insert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Database error: " + error.message }, { status: 500 })
    }

    console.log("Subscription saved successfully:", data)

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error in subscribe route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
