"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"

// Oculta sus children en rutas de dashboard
export function NavGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() || ""
  const isDashboard =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/coach-dashboard") ||
    pathname.startsWith("/wildbrowl/admin")

  if (isDashboard) return null
  return <>{children}</>
}
