"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Trophy, Users, Newspaper, Star, Play, ArrowRight } from "lucide-react"

interface Game {
  id: number
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  game_date: string
  game_time: string
  venue: string
  field: string
  category: string
  referee1?: string
  referee2?: string
  mvp?: string
  status: string
}

interface Team {
  id: number
  name: string
  category: string
  logo_url?: string
  color1: string
  color2: string
}

interface News {
  id: number
  title: string
  content: string
  image_url?: string
  author: string
  created_at: string
}

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [gamesResponse, teamsResponse, newsResponse] = await Promise.all([
        fetch("/api/games"),
        fetch("/api/teams"),
        fetch("/api/news"),
      ])

      const [gamesData, teamsData, newsData] = await Promise.all([
        gamesResponse.json(),
        teamsResponse.json(),
        newsResponse.json(),
      ])

      if (gamesData.success) {
        setGames(gamesData.data)
      }

      if (teamsData.success) {
        setTeams(teamsData.data)
      }

      if (newsData.success) {
        setNews(newsData.data.slice(0, 3))
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const upcomingGames = games
    .filter((game) => game.status === "programado")
    .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
    .slice(0, 6)

  const liveGames = games.filter((game) => game.status === "en_vivo")

  const recentGames = games
    .filter((game) => game.status === "finalizado")
    .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
    .slice(0, 6)

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      "varonil-gold": "Varonil Gold",
      "varonil-silver": "Varonil Silver",
      "femenil-gold": "Femenil Gold",
      "femenil-silver": "Femenil Silver",
      "mixto-gold": "Mixto Gold",
      "mixto-silver": "Mixto Silver",
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white">Liga Flag Durango</h1>
              <p className="text-white/70">Temporada 2025</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="/" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Inicio
              </a>
              <a href="/partidos" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Partidos
              </a>
              <a href="/equipos" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Equipos
              </a>
              <a href="/estadisticas" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Estadísticas
              </a>
              <a href="/noticias" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Noticias
              </a>
              <a href="/login" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Cuenta
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-orange-500/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Liga Flag
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {" "}
                Durango
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
              La liga de flag football más emocionante de Durango. Únete a la acción con 6 categorías competitivas y
              partidos llenos de adrenalina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
                onClick={() => (window.location.href = "/partidos")}
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Partidos
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                onClick={() => (window.location.href = "/equipos")}
              >
                Conocer Equipos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Live Games */}
        {liveGames.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                EN VIVO
              </h2>
              <p className="text-white/70 text-lg">Partidos que se están jugando ahora mismo</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveGames.map((game) => (
                <Card
                  key={game.id}
                  className="bg-red-500/20 backdrop-blur-sm border-red-500/50 hover:bg-red-500/30 transition-all transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge className="mb-4 bg-red-500 text-white animate-pulse">🔴 EN VIVO</Badge>
                      <h3 className="text-white font-bold text-xl mb-4">
                        {game.home_team} vs {game.away_team}
                      </h3>
                      <div className="text-4xl font-bold text-white mb-4">
                        {game.home_score || 0} - {game.away_score || 0}
                      </div>
                      <div className="space-y-2 text-white/70 text-sm">
                        <div className="flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {game.venue} - {game.field}
                        </div>
                        <div className="flex items-center justify-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {game.game_time}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Games */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <Calendar className="w-10 h-10 mr-3" />
              Próximos Partidos
            </h2>
            <p className="text-white/70 text-lg">No te pierdas los emocionantes encuentros que vienen</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingGames.map((game) => (
              <Card
                key={game.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="text-center">
                    <Badge className="mb-4 bg-blue-600">{getCategoryLabel(game.category)}</Badge>
                    <h3 className="text-white font-bold text-xl mb-4">
                      {game.home_team} vs {game.away_team}
                    </h3>
                    <div className="space-y-3 text-white/70 text-sm">
                      <div className="flex items-center justify-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(game.game_date).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {game.game_time}
                      </div>
                      <div className="flex items-center justify-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {game.venue} - {game.field}
                      </div>
                      {(game.referee1 || game.referee2) && (
                        <div className="text-xs">
                          Árbitros: {[game.referee1, game.referee2].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {upcomingGames.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">No hay partidos programados próximamente</p>
            </div>
          )}
        </section>

        {/* Recent Results */}
        {recentGames.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                <Trophy className="w-10 h-10 mr-3" />
                Resultados Recientes
              </h2>
              <p className="text-white/70 text-lg">Los últimos partidos finalizados con sus marcadores</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentGames.map((game) => (
                <Card
                  key={game.id}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Badge className="mb-4 bg-green-600">{getCategoryLabel(game.category)}</Badge>
                      <h3 className="text-white font-bold text-xl mb-2">
                        {game.home_team} vs {game.away_team}
                      </h3>
                      <div className="text-4xl font-bold text-white mb-4">
                        {game.home_score} - {game.away_score}
                      </div>
                      <div className="space-y-2 text-white/70 text-sm">
                        <div className="flex items-center justify-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(game.game_date).toLocaleDateString("es-ES")}
                        </div>
                        <div className="flex items-center justify-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {game.venue} - {game.field}
                        </div>
                        {game.mvp && (
                          <div className="flex items-center justify-center text-yellow-400">
                            <Star className="w-4 h-4 mr-1" />
                            MVP: {game.mvp}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Latest News */}
        {news.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                <Newspaper className="w-10 h-10 mr-3" />
                Últimas Noticias
              </h2>
              <p className="text-white/70 text-lg">Mantente al día con las novedades de la liga</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {news.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
                >
                  <CardContent className="p-6">
                    {item.image_url && (
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-white/70 text-sm mb-4 line-clamp-3">{item.content}</p>
                    <div className="flex justify-between items-center text-xs text-white/60">
                      <span>Por: {item.author}</span>
                      <span>{new Date(item.created_at).toLocaleDateString("es-ES")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Stats Summary */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Liga en Números</h2>
            <p className="text-white/70 text-lg">Estadísticas generales de la temporada actual</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">{teams.length}</h3>
                <p className="text-white/70">Equipos Registrados</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">{games.length}</h3>
                <p className="text-white/70">Partidos Programados</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">{recentGames.length}</h3>
                <p className="text-white/70">Partidos Finalizados</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
              <CardContent className="p-6 text-center">
                <Newspaper className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">{news.length}</h3>
                <p className="text-white/70">Noticias Publicadas</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">Liga Flag Durango</h3>
              <p className="text-white/70 mb-4">
                La liga de flag football más emocionante de Durango. Únete a nosotros y vive la pasión del deporte.
              </p>
              <div className="text-white/60">
                <p>📍 Durango, México</p>
                <p>📞 618-123-4567</p>
                <p>✉️ info@ligaflagdurango.com</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="/partidos" className="hover:text-white transition-colors">
                    Partidos
                  </a>
                </li>
                <li>
                  <a href="/equipos" className="hover:text-white transition-colors">
                    Equipos
                  </a>
                </li>
                <li>
                  <a href="/estadisticas" className="hover:text-white transition-colors">
                    Estadísticas
                  </a>
                </li>
                <li>
                  <a href="/noticias" className="hover:text-white transition-colors">
                    Noticias
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Categorías</h4>
              <ul className="space-y-2 text-white/70">
                <li>Varonil Gold</li>
                <li>Varonil Silver</li>
                <li>Femenil Gold</li>
                <li>Femenil Silver</li>
                <li>Mixto Gold</li>
                <li>Mixto Silver</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2025 Liga Flag Durango. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
