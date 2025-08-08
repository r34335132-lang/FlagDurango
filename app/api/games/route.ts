import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-admin"

// Números: "" | undefined | null -> null; si es número válido, number
function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === undefined || value === null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// Strings: undefined | null -> null; trim y "" -> null
function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s.length === 0 ? null : s
}

// Normaliza categoría a kebab-case consistente
function normalizeCategory(value: unknown): string {
  if (value === undefined || value === null) return ""
  return String(value)
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// IMPORTANTE: el constraint de DB acepta "en_vivo" (con guion bajo).
// Aceptamos varias variantes de entrada pero siempre guardamos "en_vivo" | "programado" | "finalizado".
function normalizeStatus(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase()
  if (s === "en vivo" || s === "en_vivo") return "en_vivo"
  if (s === "programado") return "programado"
  if (s === "finalizado") return "finalizado"
  // fallback: si viene cualquier otro, lo devolvemos tal cual (puede fallar por constraint y así detectamos)
  return String(value ?? "")
}

// Resolver categoría final:
// - Si ambos equipos existen: deben pertenecer a la MISMA categoría (normalizada). Se usa esa y se ignora un provided que no coincida.
// - Si no existen ambos equipos: si vino categoría, usar la proporcionada normalizada; si no, error.
async function resolveCategory(
  home_team: string,
  away_team: string,
  providedCategory?: string | null
): Promise<{ ok: true; category: string } | { ok: false; message: string; status?: number }> {
  const providedNorm = normalizeCategory(providedCategory ?? "")
  const hasProvided = providedNorm.length > 0

  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .select("name, category")
    .in("name", [home_team, away_team])

  if (teamsErr) {
    console.error("❌ Error fetching teams for category resolution:", teamsErr)
    return { ok: false, message: teamsErr.message, status: 500 }
  }

  const home = teams?.find((t) => t.name === home_team)
  const away = teams?.find((t) => t.name === away_team)

  const homeNorm = home ? normalizeCategory(home.category) : ""
  const awayNorm = away ? normalizeCategory(away.category) : ""

  if (home && away) {
    if (homeNorm !== awayNorm) {
      return { ok: false, message: "Los equipos pertenecen a categorías distintas", status: 400 }
    }
    // Preferimos la categoría real de los equipos; si provided no coincide, la ignoramos (no error)
    if (hasProvided && providedNorm !== homeNorm) {
      console.warn("⚠️ La categoría proporcionada no coincide; se usará la de los equipos:", {
        provided: providedNorm,
        teamsCategory: homeNorm,
      })
    }
    return { ok: true, category: homeNorm }
  }

  if (hasProvided) {
    return { ok: true, category: providedNorm }
  }

  return { ok: false, message: "No se pueden inferir categorías: equipos no encontrados", status: 400 }
}

export async function GET() {
  try {
    const { data: games, error } = await supabase
      .from("games")
      .select("*")
      .order("game_date", { ascending: true })
      .order("game_time", { ascending: true })

    if (error) {
      console.error("❌ Error fetching games:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: games || [] })
  } catch (error) {
    console.error("💥 Error in games GET:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      home_team,
      away_team,
      game_date,
      game_time,
      venue,
      field,
      category,
      referee1,
      referee2,
      status = "programado",
      match_type = "jornada",
      mvp,
      home_score,
      away_score,
    } = body

    const normalizedStatus = normalizeStatus(status ?? "programado")

    // Requeridos
    if (!home_team || !away_team || !game_date || !game_time || !venue || !field) {
      return NextResponse.json(
        { success: false, message: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (home_team === away_team) {
      return NextResponse.json(
        { success: false, message: "Un equipo no puede jugar contra sí mismo" },
        { status: 400 }
      )
    }

    // Categoría final
    const cat = await resolveCategory(home_team, away_team, category)
    if (!cat.ok) {
      return NextResponse.json({ success: false, message: cat.message }, { status: cat.status ?? 400 })
    }

    // Sanitizar
    const home_score_sanitized = toNumberOrNull(home_score)
    const away_score_sanitized = toNumberOrNull(away_score)
    const referee1San = toStringOrNull(referee1)
    const referee2San = toStringOrNull(referee2)
    const mvpSan = toStringOrNull(mvp)

    const { data: inserted, error } = await supabase
      .from("games")
      .insert([
        {
          home_team,
          away_team,
          game_date,
          game_time,
          venue,
          field,
          category: cat.category,
          referee1: referee1San,
          referee2: referee2San,
          status: normalizedStatus,
          match_type,
          mvp: mvpSan,
          home_score: home_score_sanitized,
          away_score: away_score_sanitized,
        },
      ])
      .select("id")
      .single()

    if (error) {
      console.error("❌ Error creating game:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    const { data: game, error: fetchErr } = await supabase
      .from("games")
      .select("*")
      .eq("id", inserted!.id)
      .single()

    if (fetchErr || !game) {
      return NextResponse.json(
        { success: false, message: "El partido no quedó guardado, verificación fallida" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error("💥 Error in games POST:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      status,
      home_score,
      away_score,
      mvp,
      match_type,
      game_date,
      game_time,
      venue,
      field,
      referee1,
      referee2,
      category,
      home_team,
      away_team,
    } = body

    const idNum = typeof id === "string" ? Number.parseInt(id, 10) : id
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ success: false, message: "ID inválido" }, { status: 400 })
    }

    // Cargar juego actual
    const { data: current, error: currentErr } = await supabase
      .from("games")
      .select("id, home_team, away_team, category")
      .eq("id", idNum)
      .single()

    if (currentErr || !current) {
      return NextResponse.json({ success: false, message: "No se encontró el partido" }, { status: 404 })
    }

    const newHomeTeam = home_team ?? current.home_team
    const newAwayTeam = away_team ?? current.away_team
    if (newHomeTeam === newAwayTeam) {
      return NextResponse.json(
        { success: false, message: "Un equipo no puede jugar contra sí mismo" },
        { status: 400 }
      )
    }

    // Determinar categoría final si cambia equipos o viene category
    let finalCategory = current.category
    if (home_team !== undefined || away_team !== undefined || category !== undefined) {
      const cat = await resolveCategory(newHomeTeam, newAwayTeam, category)
      if (!cat.ok) {
        return NextResponse.json({ success: false, message: cat.message }, { status: cat.status ?? 400 })
      }
      finalCategory = cat.category
    }

    const updateData: Record<string, any> = {}
    if (status !== undefined) updateData.status = normalizeStatus(status)
    if (home_score !== undefined) updateData.home_score = toNumberOrNull(home_score)
    if (away_score !== undefined) updateData.away_score = toNumberOrNull(away_score)
    if (mvp !== undefined) updateData.mvp = toStringOrNull(mvp)
    if (match_type !== undefined) updateData.match_type = match_type
    if (game_date !== undefined) updateData.game_date = game_date
    if (game_time !== undefined) updateData.game_time = game_time
    if (venue !== undefined) updateData.venue = toStringOrNull(venue)
    if (field !== undefined) updateData.field = toStringOrNull(field)
    if (referee1 !== undefined) updateData.referee1 = toStringOrNull(referee1)
    if (referee2 !== undefined) updateData.referee2 = toStringOrNull(referee2)
    if (home_team !== undefined) updateData.home_team = newHomeTeam
    if (away_team !== undefined) updateData.away_team = newAwayTeam
    if (home_team !== undefined || away_team !== undefined || category !== undefined) {
      updateData.category = finalCategory
    }

    const { data: game, error } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", idNum)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating game:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    if (!game) {
      return NextResponse.json({ success: false, message: "No se pudo actualizar el partido" }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error("💥 Error in games PUT:", error)
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
    const idNum = Number.parseInt(id, 10)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ success: false, message: "ID inválido" }, { status: 400 })
    }
    const { error } = await supabase.from("games").delete().eq("id", idNum)
    if (error) {
      console.error("❌ Error deleting game:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: "Partido eliminado exitosamente" })
  } catch (error) {
    console.error("💥 Error in games DELETE:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
