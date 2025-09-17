"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

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

  useEffect(() => {
    // Check if app is already installed
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show install prompt after 30 seconds
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true)
        }
      }, 30000)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

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

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Download className="w-5 h-5 text-white" />
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

        <p className="text-sm text-gray-600 mb-4">Instala la app para acceso rápido y notificaciones de partidos.</p>

        <div className="flex gap-2">
          <Button onClick={handleInstallClick} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" size="sm">
            Instalar
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="sm">
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  )
}
