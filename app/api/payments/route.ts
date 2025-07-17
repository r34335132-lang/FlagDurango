import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 Fetching payments...")

    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        team:teams(name),
        player:players(name),
        referee:referees(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching payments:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${payments?.length || 0} payments`)
    return NextResponse.json({ success: true, data: payments || [] })
  } catch (error) {
    console.error("💥 Error in payments GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 Creating new payment...")
    const body = await request.json()
    console.log("📋 Payment data:", body)

    const { team_id, player_id, referee_id, type, amount, description, status, due_date } = body

    if (!type || !amount) {
      console.log("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Tipo y monto son requeridos",
        },
        { status: 400 },
      )
    }

    // Validar que el tipo sea válido (basado en tu comentario que solo funciona team_registration)
    const validTypes = ["team_registration", "referee_payment", "field_rental", "equipment", "other"]
    const safeType = validTypes.includes(type) ? type : "team_registration"

    const { data: payment, error } = await supabase
      .from("payments")
      .insert([
        {
          team_id: team_id || null,
          player_id: player_id || null,
          referee_id: referee_id || null,
          type: safeType,
          amount: Number.parseFloat(amount),
          description: description || null,
          status: status || "pending",
          due_date: due_date || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating payment:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Payment created successfully:", payment.id)
    return NextResponse.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    console.error("💥 Error in payments POST:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    console.log("📝 Updating payment:", id)
    console.log("📋 Update data:", body)

    const { team_id, player_id, referee_id, type, amount, description, status, due_date, paid_date } = body

    const updateData: any = {}
    if (team_id !== undefined) updateData.team_id = team_id
    if (player_id !== undefined) updateData.player_id = player_id
    if (referee_id !== undefined) updateData.referee_id = referee_id
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) updateData.amount = Number.parseFloat(amount)
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (due_date !== undefined) updateData.due_date = due_date
    if (paid_date !== undefined) updateData.paid_date = paid_date

    const { data: payment, error } = await supabase.from("payments").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ Error updating payment:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Payment updated successfully:", id)
    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error("💥 Error in payments PUT:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    console.log("🗑️ Deleting payment:", id)

    const { error } = await supabase.from("payments").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting payment:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ Payment deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Pago eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in payments DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
