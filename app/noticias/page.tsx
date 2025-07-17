"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Calendar, User } from "lucide-react"

interface NewsArticle {
  id: number
  title: string
  content: string
  author: string
  published_at: string
  image_url?: string
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate fetching news data
    const fetchNews = async () => {
      setLoading(true)
      setError(null)
      try {
        // In a real app, you'd fetch from an API:
        // const response = await fetch('/api/news');
        // const data = await response.json();
        // if (data.success) {
        //   setNews(data.data);
        // } else {
        //   setError(data.message || "Error al cargar noticias.");
        // }

        // Mock data for now
        const mockNews: NewsArticle[] = [
          {
            id: 1,
            title: "¡Gran Inauguración de la Temporada 2025!",
            content:
              "La Liga Flag Durango dio inicio a su temporada 2025 con una ceremonia espectacular y partidos emocionantes. Equipos de todas las categorías demostraron su talento y pasión por el flag football.",
            author: "Admin Liga",
            published_at: "2025-07-10T10:00:00Z",
            image_url: "/placeholder.svg?height=200&width=400",
          },
          {
            id: 2,
            title: "Entrevista Exclusiva con el Capitán de los 'Dragones'",
            content:
              "Hablamos con el capitán del equipo 'Dragones', campeón defensor, sobre sus expectativas para la nueva temporada y los desafíos que enfrentarán.",
            author: "Reportero Deportivo",
            published_at: "2025-07-08T14:30:00Z",
            image_url: "/placeholder.svg?height=200&width=400",
          },
          {
            id: 3,
            title: "Clínica de Flag Football para Jóvenes Talentos",
            content:
              "La liga organizó una clínica gratuita para niños y jóvenes, fomentando el deporte y descubriendo futuras promesas del flag football en Durango.",
            author: "Coordinación de Eventos",
            published_at: "2025-07-05T09:00:00Z",
            image_url: "/placeholder.svg?height=200&width=400",
          },
          {
            id: 4,
            title: "Resultados Destacados de la Jornada 1",
            content:
              "Un resumen de los partidos más emocionantes y los resultados sorprendentes de la primera jornada de la temporada.",
            author: "Estadísticas Liga",
            published_at: "2025-07-12T18:00:00Z",
            image_url: "/placeholder.svg?height=200&width=400",
          },
        ]
        setNews(mockNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()))
      } catch (err) {
        console.error("Error fetching news:", err)
        setError("Error de red o del servidor al cargar noticias.")
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando noticias...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="pt-16 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">Últimas Noticias</h1>
          <p className="text-white/80">Mantente al día con todo lo que sucede en la Liga Flag Durango.</p>
        </div>
      </div>

      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article) => (
            <Card key={article.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              {article.image_url && (
                <div className="relative h-48 w-full">
                  <img
                    src={article.image_url || "/placeholder.svg"}
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <CardTitle className="text-xl font-semibold text-gray-800 line-clamp-2">{article.title}</CardTitle>
                <p className="text-sm text-gray-600 line-clamp-3">{article.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 mt-auto">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(article.published_at).toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {news.length === 0 && (
          <p className="text-center text-gray-600 text-lg mt-8">No hay noticias disponibles en este momento.</p>
        )}
      </div>
    </div>
  )
}
