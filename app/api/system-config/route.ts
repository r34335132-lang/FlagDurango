import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: configs, error } = await supabase
      .from("system_config")
      .select("*")
      .order("config_key")

    if (error) {
      console.error("Error fetching system config:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: configs })
  } catch (error) {
    console.error("Error in system-config GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config_key, config_value, description } = await request.json()

    if (!config_key || config_value === undefined) {
      return NextResponse.json(
        { success: false, message: "config_key y config_value son requeridos" },
        { status: 400 }
      )
    }

    const { data: config, error } = await supabase
      .from("system_config")
      .upsert(
        {
          config_key,
          config_value,
          description: description || `Configuration for ${config_key}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "config_key" }
      )
      .select()
      .single()

    if (error) {
      console.error("Error updating system config:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error("Error in system-config POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
