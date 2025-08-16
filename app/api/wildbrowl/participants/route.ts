import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: participants, error } = await supabase
      .from("wildbrowl_participants")
      .select(`
        id,
        tournament_id,
        player_name,
        email,
        phone,
        category,
        payment_status,
        payment_method,
        bracket_position,
        eliminated,
        photo_url,
        status,
        created_at,
        updated_at
      `)
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
    const { player_name, email, phone, category, payment_method, name, alias } = await request.json()

    // Usar player_name o name como fallback
    const finalPlayerName = player_name || name

    if (!finalPlayerName || !category) {
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
      .eq("player_name", finalPlayerName)
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

    // Preparar datos para insertar - solo incluir email y phone si tienen valores
    const insertData: any = {
      player_name: finalPlayerName,
      category,
      payment_method: payment_method || "online",
      payment_status: payment_method === "cash" ? "pending_cash" : "pending",
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

    return NextResponse.json({ success: true, data: participant })
  } catch (error) {
    console.error("Error in participants POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, player_name, email, phone, category, payment_status, status, bracket_position, eliminated } =
      await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    const updateData: any = {}
    if (player_name) updateData.player_name = player_name
    if (email !== undefined) updateData.email = email && email.trim() !== "" ? email.trim() : null
    if (phone !== undefined) updateData.phone = phone && phone.trim() !== "" ? phone.trim() : null
    if (category) updateData.category = category
    if (payment_status) updateData.payment_status = payment_status
    if (status) updateData.status = status
    if (bracket_position !== undefined) updateData.bracket_position = bracket_position
    if (eliminated !== undefined) updateData.eliminated = eliminated

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

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    // Verificar si el participante tiene partidos asociados
    const { data: matches } = await supabase
      .from("wildbrowl_matches")
      .select("id")
      .or(`participant1_id.eq.${id},participant2_id.eq.${id}`)

    if (matches && matches.length > 0) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar un participante que tiene partidos asociados" },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("wildbrowl_participants").delete().eq("id", id)

    if (error) {
      console.error("Error deleting participant:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Participante eliminado correctamente" })
  } catch (error) {
    console.error("Error in participants DELETE:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
