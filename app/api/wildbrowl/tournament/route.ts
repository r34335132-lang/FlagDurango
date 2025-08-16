import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: tournaments, error } = await supabase
      .from("wildbrowl_tournaments")
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        entry_fee,
        prize_pool,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tournaments:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tournaments || [] })
  } catch (error) {
    console.error("Error in tournaments GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, start_date, end_date, registration_deadline, entry_fee, prize_pool } =
      await request.json()

    if (!name) {
      return NextResponse.json({ success: false, error: "Nombre del torneo es requerido" }, { status: 400 })
    }

    // Desactivar torneos anteriores
    await supabase.from("wildbrowl_tournaments").update({ status: "finalizado" }).neq("status", "finalizado")

    const { data: tournament, error } = await supabase
      .from("wildbrowl_tournaments")
      .insert([
        {
          name,
          description: description || null,
          start_date: start_date || null,
          end_date: end_date || null,
          registration_deadline: registration_deadline || null,
          entry_fee: entry_fee || 0,
          prize_pool: prize_pool || 0,
          status: "activo",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating tournament:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tournament })
  } catch (error) {
    console.error("Error in tournaments POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, description, start_date, end_date, registration_deadline, entry_fee, prize_pool, status } =
      await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (registration_deadline !== undefined) updateData.registration_deadline = registration_deadline
    if (entry_fee !== undefined) updateData.entry_fee = entry_fee
    if (prize_pool !== undefined) updateData.prize_pool = prize_pool
    if (status) updateData.status = status

    const { data: tournament, error } = await supabase
      .from("wildbrowl_tournaments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating tournament:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tournament })
  } catch (error) {
    console.error("Error in tournaments PUT:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID es requerido" }, { status: 400 })
    }

    // Verificar si el torneo tiene participantes
    const { data: participants } = await supabase.from("wildbrowl_participants").select("id").eq("tournament_id", id)

    if (participants && participants.length > 0) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar un torneo que tiene participantes" },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("wildbrowl_tournaments").delete().eq("id", id)

    if (error) {
      console.error("Error deleting tournament:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Torneo eliminado correctamente" })
  } catch (error) {
    console.error("Error in tournaments DELETE:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
