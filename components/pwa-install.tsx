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

function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if app is already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Show install prompt after 30 seconds if not installed
    const timer = setTimeout(() => {
      if (!standalone && !iOS) {
        setShowInstallPrompt(true)
      }
    }, 30000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      clearTimeout(timer)
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
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for 24 hours
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  if (isStandalone) return null

  const dismissedTime = localStorage.getItem("pwa-install-dismissed")
  if (dismissedTime && Date.now() - Number.parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Instalar App</h3>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {isIOS
            ? "Instala Liga Flag Durango en tu pantalla de inicio para acceso rápido."
            : "Instala nuestra app para una mejor experiencia y acceso offline."}
        </p>

        {isIOS ? (
          <div className="text-sm text-gray-600">
            <p className="mb-2">Para instalar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Toca el botón de compartir <span className="inline-block">⎋</span>
              </li>
              <li>
                Selecciona "Añadir a pantalla de inicio" <span className="inline-block">➕</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleInstallClick} className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Ahora no
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PWAInstall
