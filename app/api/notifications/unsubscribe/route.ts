import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json()

    console.log("Unsubscribing endpoint:", endpoint?.substring(0, 50) + "...")

    if (!endpoint) {
      return NextResponse.json({ success: false, error: "Endpoint is required" }, { status: 400 })
    }

    // Eliminar suscripción de la base de datos
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Database error: " + error.message }, { status: 500 })
    }

    console.log("Subscription removed successfully")

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
    })
  } catch (error) {
    console.error("Error in unsubscribe route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
