import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("👥 Fetching players...")

    const { data: players, error } = await supabase
      .from("players")
      .select(`
        id,
        name,
        jersey_number,
        position,
        photo_url,
        team_id,
        created_at,
        teams!players_team_id_fkey (
          id,
          name,
          category,
          logo_url,
          color1,
          color2
        )
      `)
      .order("name", { ascending: true })

    if (error) {
      console.error("❌ Error fetching players:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener jugadores",
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Found ${players?.length || 0} players`)

    return NextResponse.json({
      success: true,
      data: players || [],
    })
  } catch (error) {
    console.error("💥 Error in players API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("👤 Creating player with data:", body)

    const { name, jersey_number, position, team_id, photo_url } = body

    if (!name || !team_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Nombre y equipo son requeridos",
        },
        { status: 400 },
      )
    }

    // Verificar si ya existe un jugador con ese número en el mismo equipo
    if (jersey_number) {
      const { data: existing, error: checkError } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", Number(team_id))
        .eq("jersey_number", Number(jersey_number))

      if (checkError) {
        console.error("Error checking existing player:", checkError)
      } else if (existing && existing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Ya existe un jugador con el número ${jersey_number} en este equipo`,
          },
          { status: 400 },
        )
      }
    }

    const { data: newPlayer, error } = await supabase
      .from("players")
      .insert({
        name: name.trim(),
        jersey_number: jersey_number ? Number(jersey_number) : null,
        position: position || null,
        team_id: Number(team_id),
        photo_url: photo_url || null,
      })
      .select(`
        id,
        name,
        jersey_number,
        position,
        photo_url,
        team_id,
        created_at,
        teams!players_team_id_fkey (
          id,
          name,
          category,
          logo_url
        )
      `)
      .single()

    if (error) {
      console.error("❌ Error creating player:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear jugador",
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Player created successfully:", newPlayer.id)

    return NextResponse.json({
      success: true,
      data: newPlayer,
      message: "Jugador creado exitosamente",
    })
  } catch (error) {
    console.error("💥 Error in player creation:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Updating player with data:", body)

    const { id, name, jersey_number, position, photo_url, team_id } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID del jugador es requerido",
        },
        { status: 400 },
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (jersey_number !== undefined) updateData.jersey_number = jersey_number ? Number(jersey_number) : null
    if (position !== undefined) updateData.position = position || null
    if (photo_url !== undefined) updateData.photo_url = photo_url || null
    if (team_id !== undefined) updateData.team_id = Number(team_id)

    const { data: updatedPlayer, error } = await supabase
      .from("players")
      .update(updateData)
      .eq("id", Number(id))
      .select(`
        id,
        name,
        jersey_number,
        position,
        photo_url,
        team_id,
        teams!players_team_id_fkey (
          id,
          name,
          category,
          logo_url
        )
      `)
      .single()

    if (error) {
      console.error("❌ Error updating player:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Error al actualizar jugador",
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Player updated successfully")

    return NextResponse.json({
      success: true,
      data: updatedPlayer,
      message: "Jugador actualizado exitosamente",
    })
  } catch (error) {
    console.error("💥 Error in player update:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID del jugador es requerido",
        },
        { status: 400 },
      )
    }

    console.log("🗑️ Deleting player:", id)

    const { error } = await supabase.from("players").delete().eq("id", Number(id))

    if (error) {
      console.error("❌ Error deleting player:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Error al eliminar jugador",
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Player deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Jugador eliminado exitosamente",
    })
  } catch (error) {
    console.error("💥 Error in player deletion:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
