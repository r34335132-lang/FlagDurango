"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar si ya está instalado como PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Limpiar listener
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("PWA installation accepted")
    } else {
      console.log("PWA installation dismissed")
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  // No mostrar si ya está instalado
  if (isStandalone) {
    return null
  }

  // Prompt para iOS
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Instalar App</h3>
          </div>
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-white hover:bg-blue-600 p-1 h-auto">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs mb-3">
          Para instalar esta app en tu iPhone: toca{" "}
          <span className="inline-block w-4 h-4 border border-white rounded text-center text-xs leading-4 mx-1">⬆️</span>{" "}
          y luego "Añadir a pantalla de inicio"
        </p>
      </div>
    )
  }

  // Prompt para Android/Desktop
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Instalar App</h3>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-600 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs mb-3">Instala Liga Flag Durango en tu dispositivo para acceso rápido y notificaciones.</p>
        <div className="flex space-x-2">
          <Button onClick={handleInstallClick} size="sm" className="bg-white text-green-500 hover:bg-gray-100 flex-1">
            Instalar
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="border-white text-white hover:bg-green-600 bg-transparent"
          >
            Ahora no
          </Button>
        </div>
      </div>
    )
  }

  return null
}
