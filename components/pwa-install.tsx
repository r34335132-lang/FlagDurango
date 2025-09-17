"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(isStandaloneMode)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Show banner for iOS users (since they don't get beforeinstallprompt)
    if (iOS && !isStandaloneMode) {
      const hasSeenIOSPrompt = localStorage.getItem("ios-install-prompt-seen")
      if (!hasSeenIOSPrompt) {
        setShowInstallBanner(true)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowInstallBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    if (isIOS) {
      localStorage.setItem("ios-install-prompt-seen", "true")
    }
  }

  // Don't show if already installed or not supported
  if (isStandalone || !showInstallBanner) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">¡Instala Liga Flag Durango!</h3>
              <p className="text-xs text-blue-100 mb-3">
                {isIOS
                  ? "Toca el botón de compartir y selecciona 'Añadir a pantalla de inicio'"
                  : "Accede más rápido y recibe notificaciones de partidos"}
              </p>
              {!isIOS && (
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-blue-50 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Instalar App
                </Button>
              )}
            </div>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
