import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

const MP_BASE = "https://api.mercadopago.com"

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) return NextResponse.json({ ok: true })

    const body = await req.json()
    // MP sends: { action, api_version, data: { id }, date_created, id, live_mode, type, user_id } etc.
    const topic = body.type || body.topic
    const paymentId = body.data?.id || body.resource?.split("/").pop()

    if ((topic === "payment" || topic === "test.created") && paymentId) {
      const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payment = await res.json()

      if (payment?.status === "approved") {
        const metadata = payment?.metadata || {}
        if (metadata?.type === "wildbrowl" && metadata?.participant_id) {
          await supabase
            .from("wildbrowl_participants")
            .update({ payment_status: "paid" })
            .eq("id", metadata.participant_id)
        }
        // future: handle team registration if needed using metadata.team_id
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("MP webhook error:", e)
    return NextResponse.json({ ok: true })
  }
}
