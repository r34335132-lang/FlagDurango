import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json()

    if (!subscription) {
      return NextResponse.json({ success: false, message: "Subscription is required" }, { status: 400 })
    }

    // In a real application, you would remove this subscription from your database
    console.log("Unsubscribing from notifications:", {
      endpoint: subscription.endpoint,
    })

    // Here you would typically:
    // 1. Find the subscription in your database by endpoint
    // 2. Remove it or mark it as inactive
    // 3. Clean up any associated data

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed from notifications",
    })
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
