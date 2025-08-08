import { NextRequest, NextResponse } from "next/server"

// Nota: Si no hay credenciales, devolvemos un link de prueba
export async function POST(req: NextRequest) {
  try {
    const { title = "Registro de equipo", quantity = 1, unit_price = 1, team_id } = await req.json()

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
    if (!ACCESS_TOKEN) {
      // En entorno de prueba o sin credenciales, respondemos con link dummy
      return NextResponse.json({
        success: true,
        sandbox: true,
        init_point: "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=TEST-PREF",
        message: "Sin MP_ACCESS_TOKEN, usando link de prueba.",
      })
    }

    const pref = {
      items: [{ title, quantity, unit_price }],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/wildbrowl?status=success`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/wildbrowl?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/wildbrowl?status=pending`,
      },
      auto_return: "approved",
      metadata: { team_id },
    }

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pref),
    })
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ success: false, message: data?.message || "Error creando preferencia" }, { status: 500 })
    }

    return NextResponse.json({ success: true, init_point: data.init_point })
  } catch (error: any) {
    console.error("MercadoPago preference error:", error)
    return NextResponse.json({ success: false, message: error.message || "Error interno" }, { status: 500 })
  }
}
