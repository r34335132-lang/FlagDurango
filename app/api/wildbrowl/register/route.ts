import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    // Obtener estadísticas del torneo
    const { data: participants } = await supabase
      .from("wildbrowl_participants")
      .select("category")
      .eq("tournament_id", 1)

    const varonilCount = participants?.filter((p) => p.category === "varonil").length || 0
    const femenilCount = participants?.filter((p) => p.category === "femenil").length || 0

    const { data: matches } = await supabase.from("wildbrowl_matches").select("status").eq("tournament_id", 1)

    const totalMatches = matches?.length || 0
    const completedMatches = matches?.filter((m) => m.status === "finalizado").length || 0

    return NextResponse.json({
      success: true,
      data: {
        participants: {
          varonil: varonilCount,
          femenil: femenilCount,
          total: varonilCount + femenilCount,
        },
        matches: {
          total: totalMatches,
          completed: completedMatches,
          pending: totalMatches - completedMatches,
        },
      },
    })
  } catch (error) {
    console.error("Error in register GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { player_name, email, phone, category } = await request.json()

    if (!player_name || !category) {
      return NextResponse.json({ success: false, error: "Nombre y categoría son requeridos" }, { status: 400 })
    }

    // Validar categoría
    if (!["varonil", "femenil"].includes(category)) {
      return NextResponse.json({ success: false, error: "Categoría debe ser 'varonil' o 'femenil'" }, { status: 400 })
    }

    // Verificar si ya existe un participante con el mismo email (solo si se proporciona email)
    if (email && email.trim() !== "") {
      const { data: existing } = await supabase
        .from("wildbrowl_participants")
        .select("id")
        .eq("email", email)
        .eq("tournament_id", 1)
        .single()

      if (existing) {
        return NextResponse.json({ success: false, error: "Ya existe un participante con este email" }, { status: 400 })
      }
    }

    // Verificar si ya existe un participante con el mismo nombre
    const { data: existingName } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("player_name", player_name)
      .eq("tournament_id", 1)
      .single()

    if (existingName) {
      return NextResponse.json({ success: false, error: "Ya existe un participante con este nombre" }, { status: 400 })
    }

    // Contar participantes en la categoría
    const { count } = await supabase
      .from("wildbrowl_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", 1)
      .eq("category", category)

    if (count && count >= 32) {
      return NextResponse.json(
        { success: false, error: `La categoría ${category} ya está llena (máximo 32 participantes)` },
        { status: 400 },
      )
    }

    // Preparar datos para insertar
    const insertData: any = {
      player_name,
      category,
      payment_method: "online",
      payment_status: "pending",
      tournament_id: 1,
      status: "activo",
    }

    // Solo agregar email si tiene valor
    if (email && email.trim() !== "") {
      insertData.email = email.trim()
    }

    // Solo agregar phone si tiene valor
    if (phone && phone.trim() !== "") {
      insertData.phone = phone.trim()
    }

    const { data: participant, error } = await supabase
      .from("wildbrowl_participants")
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error("Error creating participant:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: participant,
      message: "¡Registro exitoso! Te contactaremos pronto con los detalles del torneo.",
    })
  } catch (error) {
    console.error("Error in register POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
