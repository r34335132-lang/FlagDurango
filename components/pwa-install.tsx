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
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if app is already installed
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show install prompt after 30 seconds if not already installed
      if (!isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 30000)
      }
    }

    const handleAppInstalled = () => {
      console.log("App was installed")
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // For iOS, show install prompt after 30 seconds if not installed
    if (iOS && !isInstalled) {
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 30000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log(`User response to the install prompt: ${outcome}`)

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error("Error during install prompt:", error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for 24 hours
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa-install-dismissed", Date.now().toString())
    }
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  // Check if dismissed recently
  if (typeof window !== "undefined") {
    const dismissedTime = localStorage.getItem("pwa-install-dismissed")
    if (dismissedTime && Date.now() - Number.parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
      return null
    }
  }

  // Don't show if prompt is not ready
  if (!showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Instalar App</h3>
              <p className="text-sm text-gray-600">Liga Flag Durango</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="p-1 h-auto">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {isIOS
            ? "Instala Liga Flag Durango en tu pantalla de inicio para acceso rápido."
            : "Instala nuestra app para una mejor experiencia y notificaciones de partidos."}
        </p>

        {isIOS ? (
          <div className="text-sm text-gray-600">
            <p className="mb-2 font-medium">Para instalar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Toca el botón de compartir <span className="inline-block">⬆️</span>
              </li>
              <li>Selecciona "Añadir a pantalla de inicio"</li>
              <li>Toca "Añadir"</li>
            </ol>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" size="sm">
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
