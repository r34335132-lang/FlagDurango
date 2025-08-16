import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

export async function GET() {
  try {
    // Obtener participantes
    const { data: participants, error: participantsError } = await supabase
      .from("wildbrowl_participants")
      .select("*")
      .eq("tournament_id", 1)

    if (participantsError) {
      console.error("Error fetching participants:", participantsError)
      return NextResponse.json({ success: false, error: participantsError.message }, { status: 500 })
    }

    // Obtener partidos
    const { data: matches, error: matchesError } = await supabase
      .from("wildbrowl_matches")
      .select(`
        *,
        participant1:wildbrowl_participants!participant1_id(player_name, category, alias),
        participant2:wildbrowl_participants!participant2_id(player_name, category, alias),
        winner:wildbrowl_participants!winner_id(player_name, alias)
      `)
      .eq("tournament_id", 1)

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return NextResponse.json({ success: false, error: matchesError.message }, { status: 500 })
    }

    // Calcular estadísticas
    const varonilParticipants = participants?.filter((p) => p.category === "varonil") || []
    const femenilParticipants = participants?.filter((p) => p.category === "femenil") || []
    const paidParticipants = participants?.filter((p) => p.is_paid) || []

    const varonilMatches = matches?.filter((m) => m.participant1?.category === "varonil") || []
    const femenilMatches = matches?.filter((m) => m.participant1?.category === "femenil") || []

    // Encontrar campeones
    const varonilChampion =
      varonilMatches.find((m) => m.round === "final" && m.status === "finalizado")?.winner?.player_name || null
    const femenilChampion =
      femenilMatches.find((m) => m.round === "final" && m.status === "finalizado")?.winner?.player_name || null
    const supremeChampion =
      matches?.find((m) => m.round === "champion_of_champions" && m.status === "finalizado")?.winner?.player_name ||
      null

    const stats = {
      participants: {
        total: participants?.length || 0,
        varonil: varonilParticipants.length,
        femenil: femenilParticipants.length,
        activos: participants?.filter((p) => p.status === "activo").length || 0,
        pagados: paidParticipants.length,
        varonilSpotsLeft: Math.max(0, 32 - varonilParticipants.length),
        femenilSpotsLeft: Math.max(0, 32 - femenilParticipants.length),
      },
      matches: {
        total: matches?.length || 0,
        completed: matches?.filter((m) => m.status === "finalizado").length || 0,
        live: matches?.filter((m) => m.status === "en_vivo").length || 0,
        pending: matches?.filter((m) => m.status === "programado").length || 0,
      },
      champions: {
        varonil: varonilChampion,
        femenil: femenilChampion,
        supreme: supremeChampion,
      },
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Error in register GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { player_name, email, phone, category } = await request.json()

    if (!player_name || !category) {
      return NextResponse.json({ success: false, error: "Nombre y categoría son requeridos" }, { status: 400 })
    }

    // Validar categoría
    if (!["varonil", "femenil"].includes(category)) {
      return NextResponse.json({ success: false, error: "Categoría debe ser 'varonil' o 'femenil'" }, { status: 400 })
    }

    // Verificar límite de participantes por categoría
    const { data: existingParticipants } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("tournament_id", 1)
      .eq("category", category)
      .eq("status", "activo")

    if (existingParticipants && existingParticipants.length >= 32) {
      return NextResponse.json(
        { success: false, error: `La categoría ${category} ya tiene el máximo de 32 participantes` },
        { status: 400 },
      )
    }

    // Verificar duplicados
    const { data: duplicate } = await supabase
      .from("wildbrowl_participants")
      .select("id")
      .eq("tournament_id", 1)
      .eq("player_name", player_name)
      .single()

    if (duplicate) {
      return NextResponse.json({ success: false, error: "Ya existe un participante con ese nombre" }, { status: 400 })
    }

    // Crear participante
    const { data: participant, error } = await supabase
      .from("wildbrowl_participants")
      .insert([
        {
          tournament_id: 1,
          player_name,
          email: email || null,
          phone: phone || null,
          category,
          payment_method: "efectivo",
          payment_status: "pendiente",
          status: "activo",
          is_paid: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating participant:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: participant,
      message: "¡Registro exitoso! Procede con el pago para confirmar tu participación.",
    })
  } catch (error) {
    console.error("Error in register POST:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
