import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Proteger rutas del admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const userCookie = request.cookies.get("user")

    console.log("Middleware - Verificando acceso a admin")
    console.log("Cookie encontrada:", !!userCookie)

    if (!userCookie) {
      console.log("No hay cookie, redirigiendo a login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const userData = JSON.parse(userCookie.value)
      console.log("Datos del usuario desde cookie:", userData)

      // Verificar que el usuario tenga permisos de admin o staff
      if (userData.role !== "admin" && userData.role !== "staff") {
        console.log("Usuario sin permisos:", userData.role)
        return NextResponse.redirect(new URL("/", request.url))
      }

      console.log("Acceso permitido para:", userData.username, "con rol:", userData.role)
    } catch (error) {
      console.log("Error parseando cookie:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // También proteger dashboard (por si alguien intenta acceder directamente)
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Redirigir dashboard a admin
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
}
