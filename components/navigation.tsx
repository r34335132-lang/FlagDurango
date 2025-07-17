"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
}

export function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay usuario logueado
    const checkUser = () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("user")
      }
    }

    checkUser()

    // Escuchar cambios en localStorage
    window.addEventListener("storage", checkUser)
    return () => window.removeEventListener("storage", checkUser)
  }, [])

  const handleLogout = async () => {
    try {
      // Limpiar localStorage
      localStorage.removeItem("user")

      // Limpiar cookies
      document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      setUser(null)

      // Redirigir a inicio
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/partidos", label: "Partidos" },
    { href: "/equipos", label: "Equipos" },
    { href: "/estadisticas", label: "Estadísticas" },
    { href: "/noticias", label: "Noticias" },
  ]

  return (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-white">Liga Flag Durango</h1>
            <p className="text-white/70 text-sm">Temporada 2025</p>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-yellow-400 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 font-medium">
                  Admin
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-white/80 text-sm">Hola, {user.username}</span>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-red-400 hover:bg-red-400/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Cuenta
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-yellow-400 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
                  <Link
                    href="/admin"
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Hola, {user.username}</span>
                    <Button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-red-400 hover:bg-red-400/10"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-white hover:text-yellow-400 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cuenta
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
