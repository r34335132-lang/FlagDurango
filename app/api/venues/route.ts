import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: venues, error } = await supabase
      .from("venues")
      .select(`
        *,
        fields:fields(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching venues:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: venues })
  } catch (error) {
    console.error("Error in venues GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, city, phone } = body

    if (!name || !address || !city) {
      return NextResponse.json(
        { success: false, message: "Nombre, dirección y ciudad son requeridos" },
        { status: 400 },
      )
    }

    const { data: venue, error } = await supabase
      .from("venues")
      .insert([{ name, address, city, phone }])
      .select()
      .single()

    if (error) {
      console.error("Error creating venue:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: venue })
  } catch (error) {
    console.error("Error in venues POST:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
