import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId es requerido" },
        { status: 400 }
      )
    }

    // Obtener permisos y equipo del entrenador
    const { data: coachData, error } = await supabase
      .from("coach_permissions")
      .select(`
        *,
        teams (
          id,
          name,
          category,
          color1,
          color2,
          logo_url
        )
      `)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching coach permissions:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        permissions: {
          id: coachData.id,
          can_manage_players: coachData.can_manage_players,
          can_upload_logo: coachData.can_upload_logo,
          can_upload_photos: coachData.can_upload_photos,
          can_view_stats: coachData.can_view_stats,
          approved_by_admin: coachData.approved_by_admin,
        },
        team: coachData.teams,
      },
    })
  } catch (error) {
    console.error("Error in coach permissions GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, approved_by_admin } = await req.json()
    if (!id) return NextResponse.json({ success: false, message: "ID requerido" }, { status: 400 })

    const { data, error } = await supabase
      .from("coach_permissions")
      .update({ approved_by_admin: !!approved_by_admin })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
