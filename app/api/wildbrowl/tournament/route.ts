import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: tournament, error } = await supabase
      .from("wildbrowl_tournaments")
      .select("*")
      .single()

    if (error) {
      console.error("Error fetching tournament:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tournament })
  } catch (error) {
    console.error("Error in tournament GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { status, start_date, end_date } = await request.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (start_date) updateData.start_date = start_date
    if (end_date) updateData.end_date = end_date
    updateData.updated_at = new Date().toISOString()

    const { data: tournament, error } = await supabase
      .from("wildbrowl_tournaments")
      .update(updateData)
      .eq("id", 1) // Asumiendo que solo hay un torneo
      .select()
      .single()

    if (error) {
      console.error("Error updating tournament:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tournament })
  } catch (error) {
    console.error("Error in tournament PUT:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
