import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { player_name, email, phone, category } = await request.json()

    if (!player_name || !email || !category) {
      return NextResponse.json(
        { success: false, message: "Nombre, email y categoría son requeridos" },
        { status: 400 }
      )
    }

    // Obtener el torneo activo
    const { data: tournament, error: tournamentError } = await supabase
      .from("wildbrowl_tournaments")
      .select("*")
      .eq("status", "enabled")
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { success: false, message: "No hay torneos activos disponibles" },
        { status: 400 }
      )
    }

    // Verificar si el email ya está registrado
    const { data: existingParticipant } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("email", email)
      .eq("tournament_id", tournament.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, message: "Este email ya está registrado en el torneo" },
        { status: 400 }
      )
    }

    // Contar participantes por categoría
    const { count } = await supabase
      .from("wildbrowl_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournament.id)
      .eq("category", category)

    if (count && count >= 16) {
      return NextResponse.json(
        { success: false, message: `La categoría ${category} ya está llena (máximo 16 participantes)` },
        { status: 400 }
      )
    }

    const { data: participant, error } = await supabase
      .from("wildbrowl_participants")
      .insert([
        {
          tournament_id: tournament.id,
          player_name,
          email,
          phone,
          category,
          payment_status: "pending",
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
      message: "Registro exitoso. Te contactaremos pronto con los detalles de pago.",
      data: participant,
    })
  } catch (error) {
    console.error("Error in wildbrowl register:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
