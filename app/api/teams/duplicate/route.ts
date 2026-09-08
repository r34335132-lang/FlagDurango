import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

/**
 * Clona un equipo (y su roster) hacia la temporada activa.
 * Solo se envía season_id para respetar el trigger teams_sync_season_fields.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const resolvedTeamId = Number(body.team_id || body.source_team_id)
    const resolvedCoachUserId = Number(body.coach_user_id || body.coach_id)
    const resolvedTargetSeasonId = String(body.target_season_id || body.season_id || "").trim()

    if (!resolvedTeamId) {
      return NextResponse.json(
        { success: false, message: "team_id o source_team_id es requerido" },
        { status: 400 },
      )
    }

    if (!resolvedCoachUserId) {
      return NextResponse.json(
        { success: false, message: "coach_user_id o coach_id es requerido" },
        { status: 400 },
      )
    }

    if (!resolvedTargetSeasonId) {
      return NextResponse.json(
        { success: false, message: "target_season_id o season_id es requerido" },
        { status: 400 },
      )
    }

    const { data: sourceTeam, error: sourceError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", resolvedTeamId)
      .maybeSingle()

    if (sourceError || !sourceTeam) {
      return NextResponse.json({ success: false, message: "Equipo no encontrado" }, { status: 404 })
    }

    if (Number(sourceTeam.coach_id) !== resolvedCoachUserId) {
      return NextResponse.json(
        { success: false, message: "No tienes permisos para reinscribir este equipo" },
        { status: 403 },
      )
    }

    const { data: targetSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("id, name, year, is_active")
      .eq("id", resolvedTargetSeasonId)
      .maybeSingle()

    if (seasonError || !targetSeason) {
      return NextResponse.json(
        { success: false, message: "La temporada destino no existe" },
        { status: 400 },
      )
    }

    if (sourceTeam.season_id === targetSeason.id) {
      return NextResponse.json(
        {
          success: false,
          message: `Este equipo ya pertenece a la temporada destino (${targetSeason.name})`,
        },
        { status: 400 },
      )
    }

    const { data: existingClone } = await supabase
      .from("teams")
      .select("id, name")
      .eq("coach_id", resolvedCoachUserId)
      .eq("season_id", targetSeason.id)
      .eq("name", sourceTeam.name)
      .maybeSingle()

    if (existingClone) {
      return NextResponse.json(
        {
          success: false,
          message: `Ya tienes inscrito a "${existingClone.name}" en ${targetSeason.name}`,
          data: existingClone,
        },
        { status: 400 },
      )
    }

    const clonePayload: Record<string, unknown> = {
      name: sourceTeam.name,
      category: sourceTeam.category,
      color1: sourceTeam.color1,
      color2: sourceTeam.color2,
      logo_url: sourceTeam.logo_url,
      is_institutional: sourceTeam.is_institutional ?? false,
      coordinator_name: sourceTeam.coordinator_name,
      coordinator_phone: sourceTeam.coordinator_phone,
      captain_photo_url: sourceTeam.captain_photo_url,
      captain_name: sourceTeam.captain_name,
      captain_phone: sourceTeam.captain_phone,
      coach_name: sourceTeam.coach_name,
      coach_phone: sourceTeam.coach_phone,
      coach_photo_url: sourceTeam.coach_photo_url,
      coach_id: sourceTeam.coach_id,
      season_id: targetSeason.id,
      paid: false,
      status: "active",
    }

    let { data: newTeam, error: insertError } = await supabase
      .from("teams")
      .insert([clonePayload])
      .select("*, seasons(id, name, year, is_active)")
      .single()

    if (insertError && /season/i.test(insertError.message || "")) {
      const retry = await supabase
        .from("teams")
        .insert([{ ...clonePayload, season: targetSeason.year }])
        .select("*, seasons(id, name, year, is_active)")
        .single()
      newTeam = retry.data
      insertError = retry.error
    }

    if (insertError || !newTeam) {
      console.error("Error duplicating team:", insertError)
      return NextResponse.json(
        { success: false, message: insertError?.message || "Error al clonar el equipo" },
        { status: 500 },
      )
    }

    const { data: roster, error: rosterError } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", resolvedTeamId)

    if (rosterError) {
      console.error("Error fetching roster for clone:", rosterError)
    }

    let clonedPlayers = 0
    if (roster && roster.length > 0) {
      const playerRows = roster.map((player) => {
        const {
          id: _id,
          created_at: _createdAt,
          updated_at: _updatedAt,
          team_id: _teamId,
          ...rest
        } = player
        return {
          ...rest,
          team_id: newTeam.id,
        }
      })

      const { data: insertedPlayers, error: playersError } = await supabase
        .from("players")
        .insert(playerRows)
        .select("id")

      if (playersError) {
        console.error("Error cloning roster:", playersError)
        return NextResponse.json(
          {
            success: true,
            data: newTeam,
            message: `Equipo reinscripto, pero hubo un error al clonar el roster: ${playersError.message}`,
            cloned_players: 0,
          },
          { status: 201 },
        )
      }
      clonedPlayers = insertedPlayers?.length || 0
    }

    return NextResponse.json(
      {
        success: true,
        data: newTeam,
        cloned_players: clonedPlayers,
        message: `"${newTeam.name}" reinscripto en ${targetSeason.name} con ${clonedPlayers} jugador(es)`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in POST /api/teams/duplicate:", error)
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 })
  }
}
