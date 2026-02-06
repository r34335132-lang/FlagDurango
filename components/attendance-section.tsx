"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, XCircle, Users, Loader2, Save } from "lucide-react"

interface Game {
  id: number
  home_team: string
  away_team: string
  game_date: string
  game_time: string
  venue: string
  field: string
  category: string
  status: string
  home_score?: number
  away_score?: number
}

interface Team {
  id?: string
  name: string
  category?: string
}

interface Player {
  id?: string
  name: string
  jersey_number?: number
  number?: string
  position?: string
  photo_url?: string
  team_id?: string
  teams?: {
    id: number
    name: string
    category: string
    logo_url?: string
  }
}

interface AttendanceRecord {
  id: number
  game_id: number
  player_id: number
  attended: boolean
}

interface AttendanceSectionProps {
  games: Game[]
  teams: Team[]
  players: Player[]
}

export default function AttendanceSection({ games, teams, players }: AttendanceSectionProps) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({})
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [savedMessage, setSavedMessage] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const categories = Array.from(new Set(games.map((g) => g.category))).sort()

  const filteredGames = games.filter(
    (g) => categoryFilter === "all" || g.category === categoryFilter
  )

  const selectedGame = games.find((g) => g.id === selectedGameId)

  // Get players for the two teams in the selected game
  const getGamePlayers = useCallback(() => {
    if (!selectedGame) return []
    return players.filter((p) => {
      const teamName = p.teams?.name
      return teamName === selectedGame.home_team || teamName === selectedGame.away_team
    })
  }, [selectedGame, players])

  const gamePlayers = getGamePlayers()

  // Load attendance when game is selected
  useEffect(() => {
    if (!selectedGameId) {
      setAttendanceMap({})
      return
    }

    const loadAttendance = async () => {
      setLoadingAttendance(true)
      try {
        const res = await fetch(`/api/attendance?game_id=${selectedGameId}`)
        const data = await res.json()

        if (data.success) {
          const map: Record<number, boolean> = {}
          data.data.forEach((record: AttendanceRecord) => {
            map[record.player_id] = record.attended
          })
          setAttendanceMap(map)
        }
      } catch (error) {
        console.error("Error loading attendance:", error)
      } finally {
        setLoadingAttendance(false)
      }
    }

    loadAttendance()
  }, [selectedGameId])

  const toggleAttendance = (playerId: number) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
    setSavedMessage("")
  }

  const saveAttendance = async () => {
    if (!selectedGameId) return

    setSavingAttendance(true)
    setSavedMessage("")
    try {
      const attendance = gamePlayers.map((p) => ({
        player_id: Number(p.id),
        attended: attendanceMap[Number(p.id!)] ?? false,
      }))

      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: selectedGameId, attendance }),
      })

      const data = await res.json()
      if (data.success) {
        setSavedMessage("Asistencia guardada correctamente")
      } else {
        setSavedMessage("Error al guardar asistencia")
      }
    } catch (error) {
      console.error("Error saving attendance:", error)
      setSavedMessage("Error al guardar asistencia")
    } finally {
      setSavingAttendance(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    } catch {
      return dateStr
    }
  }

  const homePlayersForGame = gamePlayers.filter(
    (p) => p.teams?.name === selectedGame?.home_team
  )
  const awayPlayersForGame = gamePlayers.filter(
    (p) => p.teams?.name === selectedGame?.away_team
  )

  const totalAttended = Object.values(attendanceMap).filter(Boolean).length

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Asistencia a Partidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Selecciona un partido y marca la asistencia de cada jugador.
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setCategoryFilter("all")
              setSelectedGameId(null)
            }}
            className={
              categoryFilter === "all"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }
          >
            Todas
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => {
                setCategoryFilter(cat)
                setSelectedGameId(null)
              }}
              className={
                categoryFilter === cat
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Game selector */}
        <div className="mb-6">
          <select
            value={selectedGameId ?? ""}
            onChange={(e) =>
              setSelectedGameId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full border border-gray-300 rounded-md p-2 text-gray-900 bg-white"
          >
            <option value="">-- Seleccionar Partido --</option>
            {filteredGames.map((game) => (
              <option key={game.id} value={game.id}>
                {formatDate(game.game_date)} | {game.home_team} vs {game.away_team} ({game.status})
              </option>
            ))}
          </select>
        </div>

        {/* Attendance editor */}
        {selectedGame && (
          <div>
            {/* Game info header */}
            <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedGame.home_team} vs {selectedGame.away_team}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedGame.game_date)} - {selectedGame.game_time} | {selectedGame.venue}, {selectedGame.field}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      selectedGame.status === "finalizado"
                        ? "bg-green-100 text-green-800"
                        : selectedGame.status === "en_curso"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }
                  >
                    {selectedGame.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {totalAttended}/{gamePlayers.length} asistieron
                  </div>
                </div>
              </div>
            </div>

            {loadingAttendance ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Cargando asistencia...</span>
              </div>
            ) : gamePlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron jugadores para estos equipos. Verifica que los nombres de los equipos en el partido coincidan con los equipos registrados.
              </div>
            ) : (
              <>
                {/* Home team */}
                <TeamAttendanceList
                  teamName={selectedGame.home_team}
                  players={homePlayersForGame}
                  attendanceMap={attendanceMap}
                  onToggle={toggleAttendance}
                  isHome
                />

                {/* Away team */}
                <TeamAttendanceList
                  teamName={selectedGame.away_team}
                  players={awayPlayersForGame}
                  attendanceMap={attendanceMap}
                  onToggle={toggleAttendance}
                  isHome={false}
                />

                {/* Save button */}
                <div className="flex items-center gap-4 mt-6">
                  <Button
                    onClick={saveAttendance}
                    disabled={savingAttendance}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {savingAttendance ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Asistencia
                  </Button>
                  {savedMessage && (
                    <span
                      className={`text-sm font-medium ${
                        savedMessage.includes("Error")
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {savedMessage}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {!selectedGame && filteredGames.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay partidos en esta categoria.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TeamAttendanceList({
  teamName,
  players,
  attendanceMap,
  onToggle,
  isHome,
}: {
  teamName: string
  players: Player[]
  attendanceMap: Record<number, boolean>
  onToggle: (playerId: number) => void
  isHome: boolean
}) {
  const attendedCount = players.filter(
    (p) => attendanceMap[Number(p.id!)]
  ).length

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Badge className={isHome ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
            {isHome ? "Local" : "Visitante"}
          </Badge>
          {teamName}
        </h4>
        <span className="text-sm text-gray-500">
          {attendedCount}/{players.length} asistieron
        </span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-gray-400 ml-2">No hay jugadores registrados para este equipo.</p>
      ) : (
        <div className="grid gap-1">
          {players.map((player) => {
            const playerId = Number(player.id!)
            const attended = attendanceMap[playerId] ?? false

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onToggle(playerId)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all w-full text-left ${
                  attended
                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {attended ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}

                {/* Player photo */}
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">
                      {player.jersey_number || player.number || "?"}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {player.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {player.jersey_number || player.number
                      ? `#${player.jersey_number || player.number}`
                      : ""}{" "}
                    {player.position || ""}
                  </p>
                </div>

                <Badge
                  className={
                    attended
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }
                >
                  {attended ? "Asistio" : "No asistio"}
                </Badge>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
