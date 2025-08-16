import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación de admin
  if (pathname.startsWith("/admin")) {
    console.log("Middleware - Verificando acceso a admin")

    const authCookie = request.cookies.get("auth-token")
    console.log("Cookie encontrada:", !!authCookie)

    if (!authCookie) {
      console.log("No hay cookie, redirigiendo a login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const user = JSON.parse(authCookie.value)
      console.log("Usuario en cookie:", user.username, "Role:", user.role)

      if (user.role !== "admin") {
        console.log("Usuario no es admin, redirigiendo")
        return NextResponse.redirect(new URL("/", request.url))
      }

      console.log("Acceso a admin autorizado")
    } catch (error) {
      console.log("Error parseando cookie, redirigiendo a login")
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
