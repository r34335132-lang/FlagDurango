import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: fields, error } = await supabase
      .from("fields")
      .select(`
        id,
        venue_id,
        name,
        field_type,
        dimensions,
        status,
        venues(name)
      `)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching fields:", error)
      return NextResponse.json({ success: false, message: "Error al obtener campos" }, { status: 500 })
    }

    const processedFields = fields.map((field) => ({
      id: field.id,
      venue_id: field.venue_id,
      name: field.name,
      field_type: field.field_type || "artificial_turf",
      dimensions: field.dimensions || "100x50m",
      status: field.status,
      venue_name: field.venues?.name || "N/A",
    }))

    return NextResponse.json({ success: true, data: processedFields })
  } catch (error) {
    console.error("Error in GET /api/fields:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { venue_id, name, field_type, dimensions } = await request.json()

    const { data: newField, error } = await supabase
      .from("fields")
      .insert([
        {
          venue_id,
          name,
          field_type: field_type || "artificial_turf",
          dimensions: dimensions || "100x50m",
          status: "active",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating field:", error)
      return NextResponse.json({ success: false, message: "Error al crear campo" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: newField, message: "Campo creado exitosamente" })
  } catch (error) {
    console.error("Error in POST /api/fields:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
