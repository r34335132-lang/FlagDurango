import type { Metadata } from "next"
import "./globals.css"
import { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { NavGuard } from "@/components/nav-guard"

export const metadata: Metadata = {
  title: "Liga Flag Durango",
  description: "Temporada Otoño 2025",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white antialiased">
        {/* Navbar global blanca. NavGuard la oculta en dashboards */}
        <NavGuard>
          <Navigation />
        </NavGuard>
        <main>{children}</main>
      </body>
    </html>
  )
}
