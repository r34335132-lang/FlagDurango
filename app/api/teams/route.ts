import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 API: Fetching teams with players...")

    // **Paso 1: Obtener todos los equipos**
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false })

    if (teamsError) {
      console.error("❌ API: Error fetching teams:", teamsError)
      return NextResponse.json({ success: false, error: teamsError.message }, { status: 500 })
    }
    console.log(`✅ API: Found ${teams.length} teams.`)

    // **Paso 2: Obtener todos los jugadores**
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("*")
      .order("jersey_number", { ascending: true })

    if (playersError) {
      console.error("❌ API: Error fetching players:", playersError)
      return NextResponse.json({ success: false, error: playersError.message }, { status: 500 })
    }
    console.log(`✅ API: Found ${players.length} players.`)

    // **Paso 3: Combinar equipos y jugadores manualmente**
    const teamsWithPlayers = teams.map((team) => {
      const teamPlayers = players.filter((player) => player.team_id === team.id)
      return {
        ...team,
        players: teamPlayers,
      }
    })

    console.log("📊 API: Teams with players (manual join results before sending):")
    teamsWithPlayers.forEach((team) => {
      console.log(`  - Team "${team.name}" (ID: ${team.id}) has ${team.players.length} players.`)
      if (team.players.length > 0) {
        team.players.slice(0, 3).forEach((player) => {
          // Log solo los primeros 3 jugadores para no saturar
          console.log(`    * Player: ${player.name} (#${player.jersey_number})`)
        })
        if (team.players.length > 3) {
          console.log(`    ...and ${team.players.length - 3} more players.`)
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: teamsWithPlayers,
    })
  } catch (error: any) {
    console.error("💥 API: Uncaught error in teams GET:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error: " + error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 API: Creating new team...")
    const body = await request.json()
    console.log("📋 API: Received team data:", body)

    const { name, category, captain_name, contact_name, contact_phone, contact_email, logo_url, color1, color2 } = body

    if (!name || !category || !captain_name || !contact_phone || !contact_email) {
      console.log("❌ API: Missing required fields for team creation.")
      return NextResponse.json(
        {
          success: false,
          message: "Nombre, categoría, capitán, teléfono y email son requeridos",
        },
        { status: 400 },
      )
    }

    const { data: team, error } = await supabase
      .from("teams")
      .insert([
        {
          name,
          category,
          captain_name,
          contact_name: contact_name || captain_name,
          contact_phone,
          contact_email,
          logo_url: logo_url || null,
          color1: color1 || "#3B82F6",
          color2: color2 || "#1E40AF",
          status: "active",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ API: Error creating team:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ API: Team created successfully:", team.id)
    return NextResponse.json({ success: true, data: { ...team, players: [] } }) // Return with empty players array for consistency
  } catch (error: any) {
    console.error("💥 API: Uncaught error in teams POST:", error)
    return NextResponse.json({ success: false, message: "Internal Server Error: " + error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      console.log("❌ API: ID is required for delete operation.")
      return NextResponse.json({ success: false, message: "ID es requerido" }, { status: 400 })
    }

    console.log("🗑️ API: Deleting team:", id)

    const { error } = await supabase.from("teams").delete().eq("id", id)

    if (error) {
      console.error("❌ API: Error deleting team:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ API: Team deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Equipo eliminado exitosamente" })
  } catch (error: any) {
    console.error("💥 API: Uncaught error in teams DELETE:", error)
    return NextResponse.json({ success: false, message: "Internal Server Error: " + error.message }, { status: 500 })
  }
}
