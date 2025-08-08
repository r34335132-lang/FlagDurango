import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("wildbrowl_participants")
      .select("id, tournament_id, player_name, email, phone, category, payment_status, bracket_position, eliminated, photo_url")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: data || [] })
  } catch {
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { tournament_id, player_name, email, phone, category } = await request.json()

    if (!tournament_id || !player_name || !email || !category) {
      return NextResponse.json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el email ya está registrado
    const { data: existingParticipant } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("email", email)
      .eq("tournament_id", tournament_id)
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
      .eq("tournament_id", tournament_id)
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
          tournament_id,
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

    return NextResponse.json({ success: true, data: participant })
  } catch (error) {
    console.error("Error in participants POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
