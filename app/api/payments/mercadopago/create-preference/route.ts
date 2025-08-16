import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { team_id, team_name, user_email, title, amount } = body

    console.log("💳 Iniciando creación de preferencia MercadoPago")
    console.log("📋 Datos recibidos:", { team_id, team_name, user_email, title, amount })

    // Validar datos requeridos
    if (!team_id || !team_name || !title || !amount) {
      console.error("❌ Faltan datos requeridos")
      return NextResponse.json(
        {
          success: false,
          message: "Faltan datos requeridos: team_id, team_name, title, amount",
        },
        { status: 400 },
      )
    }

    // Verificar variables de entorno
    console.log("🔍 Verificando variables de entorno...")
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("VERCEL_URL:", process.env.VERCEL_URL)

    // Buscar el token de MercadoPago con diferentes nombres posibles
    const accessToken =
      process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN

    console.log("🔍 Buscando tokens de MercadoPago...")
    console.log(
      "MP_ACCESS_TOKEN:",
      process.env.MP_ACCESS_TOKEN
        ? `✅ Configurado (${process.env.MP_ACCESS_TOKEN.substring(0, 10)}...)`
        : "❌ No configurado",
    )
    console.log(
      "MERCADOPAGO_ACCESS_TOKEN:",
      process.env.MERCADOPAGO_ACCESS_TOKEN
        ? `✅ Configurado (${process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 10)}...)`
        : "❌ No configurado",
    )

    console.log(
      "Token final seleccionado:",
      accessToken ? `✅ Configurado (${accessToken.substring(0, 10)}...)` : "❌ No configurado",
    )

    if (!accessToken) {
      console.error("❌ No se encontró ningún token de MercadoPago")
      console.error(
        "Variables de entorno disponibles que contienen 'MP' o 'MERCADO':",
        Object.keys(process.env).filter((key) => key.includes("MP") || key.includes("MERCADO")),
      )
      return NextResponse.json(
        {
          success: false,
          message: "Token de MercadoPago no configurado. Verifica que tengas MP_ACCESS_TOKEN en tu .env.local",
          debug: {
            env_keys_mp: Object.keys(process.env).filter((key) => key.includes("MP")),
            env_keys_mercado: Object.keys(process.env).filter((key) => key.includes("MERCADO")),
            node_env: process.env.NODE_ENV,
            expected_var: "MP_ACCESS_TOKEN",
          },
        },
        { status: 500 },
      )
    }

    // Determinar URLs base según el entorno
    let baseUrl = "http://localhost:3000"

    if (process.env.NODE_ENV === "production") {
      baseUrl = "https://ligaflagdurango.com"
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    }

    console.log("🌐 Base URL determinada:", baseUrl)

    // Crear preferencia de pago - ARREGLADO: back_urls correctas y sin auto_return
    const preference = {
      items: [
        {
          title: title,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: "MXN",
        },
      ],
      payer: {
        email: user_email || "coach@ligaflagdurango.com",
      },
      back_urls: {
        success: `${baseUrl}/coach-dashboard?payment=success&team_id=${team_id}`,
        failure: `${baseUrl}/coach-dashboard?payment=failure&team_id=${team_id}`,
        pending: `${baseUrl}/coach-dashboard?payment=pending&team_id=${team_id}`,
      },
      // REMOVIDO: auto_return que causaba el error
      notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      external_reference: `team_${team_id}`,
      metadata: {
        team_id: team_id.toString(),
        team_name: team_name,
        payment_type: "team_registration",
      },
      statement_descriptor: "Liga Flag Durango",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    }

    console.log("📤 Enviando preferencia a MercadoPago...")
    console.log("🔗 URL:", "https://api.mercadopago.com/checkout/preferences")
    console.log("🔑 Token (primeros 10 chars):", accessToken.substring(0, 10))
    console.log("📋 Preferencia:", JSON.stringify(preference, null, 2))

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    })

    const responseText = await response.text()
    console.log("📥 Respuesta de MercadoPago:")
    console.log("Status:", response.status)
    console.log("Headers:", Object.fromEntries(response.headers.entries()))
    console.log("Body:", responseText)

    if (!response.ok) {
      console.error("❌ Error de MercadoPago:", response.status, responseText)
      return NextResponse.json(
        {
          success: false,
          message: `Error de MercadoPago (${response.status}): ${responseText}`,
          debug: {
            status: response.status,
            response: responseText,
            token_configured: !!accessToken,
            token_preview: accessToken ? accessToken.substring(0, 10) + "..." : "No configurado",
            token_source: process.env.MP_ACCESS_TOKEN
              ? "MP_ACCESS_TOKEN"
              : process.env.MERCADOPAGO_ACCESS_TOKEN
                ? "MERCADOPAGO_ACCESS_TOKEN"
                : "unknown",
            preference_sent: preference,
          },
        },
        { status: response.status },
      )
    }

    const data = JSON.parse(responseText)

    console.log("✅ Preferencia creada exitosamente:")
    console.log("ID:", data.id)
    console.log("Init Point:", data.init_point)
    console.log("Sandbox Init Point:", data.sandbox_init_point)

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      },
    })
  } catch (error) {
    console.error("💥 Error creando preferencia MercadoPago:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
        debug: {
          error_type: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}
