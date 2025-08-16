import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Webhook recibido:", body)

    const { type, data } = body

    if (type === "payment") {
      const paymentId = data.id

      // Obtener detalles del pago desde MercadoPago
      const accessToken = process.env.MP_ACCESS_TOKEN
      if (!accessToken) {
        console.error("MP_ACCESS_TOKEN no configurado")
        return NextResponse.json({ success: false }, { status: 500 })
      }

      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!paymentResponse.ok) {
        console.error("Error obteniendo pago de MP")
        return NextResponse.json({ success: false }, { status: 500 })
      }

      const payment = await paymentResponse.json()
      console.log("Detalles del pago:", payment)

      // Extraer team_id del external_reference
      const externalRef = payment.external_reference
      if (!externalRef || !externalRef.startsWith("team_")) {
        console.error("external_reference inválido:", externalRef)
        return NextResponse.json({ success: false }, { status: 400 })
      }

      const teamId = Number.parseInt(externalRef.replace("team_", ""))

      // Si el pago fue aprobado, marcar equipo como pagado
      if (payment.status === "approved") {
        console.log("Pago aprobado para equipo:", teamId)

        // Actualizar equipo
        const { error: teamError } = await supabase.from("teams").update({ paid: true }).eq("id", teamId)

        if (teamError) {
          console.error("Error actualizando equipo:", teamError)
        }

        // Registrar pago
        const { error: paymentError } = await supabase.from("payments").insert([
          {
            team_id: teamId,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            payment_method: payment.payment_method_id,
            status: payment.status,
            external_id: payment.id.toString(),
            created_at: new Date().toISOString(),
          },
        ])

        if (paymentError) {
          console.error("Error registrando pago:", paymentError)
        }

        console.log("Pago procesado exitosamente")
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
