"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, Share, Plus } from "lucide-react"

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
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if running in browser
    if (typeof window === "undefined") return

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Don't show if already installed or dismissed recently
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      const dismissedTime = dismissed ? Number.parseInt(dismissed) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      if (!standalone && daysSinceDismissed > 7) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // For iOS, show install prompt if not standalone and not dismissed recently
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      const dismissedTime = dismissed ? Number.parseInt(dismissed) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      if (daysSinceDismissed > 7) {
        setShowInstallPrompt(true)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowInstallPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setShowIOSInstructions(false)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  // Don't render on server or if already installed
  if (typeof window === "undefined" || isStandalone || !showInstallPrompt) {
    return null
  }

  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="bg-white border-2 border-blue-500 shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900">Instalar Liga Flag Durango</h3>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Share className="w-4 h-4 text-blue-500" />
                <span>1. Toca el botón de compartir</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span>2. Selecciona "Añadir a pantalla de inicio"</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span>3. Confirma la instalación</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold">¡Instala la App!</h3>
              <p className="text-sm text-blue-100">Acceso rápido desde tu pantalla de inicio</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1 bg-white text-blue-600 hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
