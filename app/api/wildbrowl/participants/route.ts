import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: participants, error } = await supabase
      .from("wildbrowl_participants")
      .select("*")
      .eq("tournament_id", 1)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching participants:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: participants || [] })
  } catch (error) {
    console.error("Error in participants GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { player_name, email, phone, category, image_url, alias } = await request.json()

    if (!player_name || !category) {
      return NextResponse.json({ success: false, error: "Nombre y categoría son requeridos" }, { status: 400 })
    }

    // Validar categoría
    if (!["varonil", "femenil"].includes(category)) {
      return NextResponse.json({ success: false, error: "Categoría debe ser 'varonil' o 'femenil'" }, { status: 400 })
    }

    // Verificar límite de participantes por categoría
    const { data: existingParticipants } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("tournament_id", 1)
      .eq("category", category)
      .eq("status", "activo")

    if (existingParticipants && existingParticipants.length >= 32) {
      return NextResponse.json(
        { success: false, error: `La categoría ${category} ya tiene el máximo de 32 participantes` },
        { status: 400 },
      )
    }

    // Verificar duplicados
    const { data: duplicate } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("tournament_id", 1)
      .eq("player_name", player_name)
      .single()

    if (duplicate) {
      return NextResponse.json({ success: false, error: "Ya existe un participante con ese nombre" }, { status: 400 })
    }

    // Crear participante
    const { data: participant, error } = await supabase
      .from("wildbrowl_participants")
      .insert([
        {
          tournament_id: 1,
          player_name,
          email: email || null,
          phone: phone || null,
          category,
          alias: alias || null,
          image_url: image_url || null,
          payment_method: "efectivo",
          payment_status: "pendiente",
          status: "activo",
          is_paid: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating participant:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: participant,
      message: "¡Registro exitoso! Procede con el pago para confirmar tu participación.",
    })
  } catch (error) {
    console.error("Error in participants POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, payment_status, image_url, alias } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    const updateData: any = {}
    if (payment_status) {
      updateData.payment_status = payment_status
      updateData.is_paid = payment_status === "pagado"
    }
    if (image_url !== undefined) updateData.image_url = image_url
    if (alias !== undefined) updateData.alias = alias

    const { data: participant, error } = await supabase
      .from("wildbrowl_participants")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating participant:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: participant })
  } catch (error) {
    console.error("Error in participants PUT:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
