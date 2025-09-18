"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, BellOff, X } from "lucide-react"

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if running in browser
    if (typeof window === "undefined" || !("Notification" in window)) return

    // Check current permission
    setPermission(Notification.permission)

    // Check if already subscribed
    checkSubscription()

    // Show prompt if permission is default and not dismissed recently
    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem("notification-prompt-dismissed")
      const dismissedTime = dismissed ? Number.parseInt(dismissed) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      if (daysSinceDismissed > 1) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }
  }, [])

  const checkSubscription = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error("Error checking subscription:", error)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeToNotifications = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    setLoading(true)
    try {
      // Request permission first
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== "granted") {
        alert("Para recibir notificaciones, necesitas permitir las notificaciones en tu navegador.")
        setLoading(false)
        return
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f53NlqKOYWsSBhjuXPiQfzuVAl9Hs4HcKSVdJiKz0g5JwQw5Y8g",
        ),
      })

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsSubscribed(true)
        setShowPrompt(false)

        // Show test notification
        new Notification("¡Notificaciones activadas!", {
          body: "Ahora recibirás notificaciones de partidos en vivo y resultados.",
          icon: "/icons/icon-192x192.png",
          tag: "welcome-notification",
        })
      } else {
        console.error("Failed to subscribe:", result)
        alert("Error al activar notificaciones. Inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error)
      alert("Error al activar notificaciones. Verifica tu conexión e inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromNotifications = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push notifications
        const unsubscribed = await subscription.unsubscribe()

        if (unsubscribed) {
          // Remove subscription from server
          const response = await fetch("/api/notifications/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            setIsSubscribed(false)
            alert("Notificaciones desactivadas correctamente.")
          } else {
            console.error("Failed to unsubscribe from server:", result)
          }
        }
      }
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error)
      alert("Error al desactivar notificaciones.")
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString())
  }

  // Don't render on server or if notifications not supported
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null
  }

  // Show permission prompt
  if (showPrompt && permission === "default") {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold">¡Mantente al día!</h3>
                <p className="text-sm text-orange-100">Recibe notificaciones de partidos en vivo y resultados</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={subscribeToNotifications}
                disabled={loading}
                className="flex-1 bg-white text-orange-600 hover:bg-orange-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                {loading ? "Activando..." : "Activar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show subscription status in bottom corner (small)
  if (permission === "granted") {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={isSubscribed ? unsubscribeFromNotifications : subscribeToNotifications}
          disabled={loading}
          className={`bg-white/90 backdrop-blur-sm ${
            isSubscribed
              ? "text-green-600 border-green-200 hover:bg-green-50"
              : "text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {loading ? (
            "..."
          ) : isSubscribed ? (
            <>
              <Bell className="w-4 h-4 mr-1" />
              Activas
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 mr-1" />
              Inactivas
            </>
          )}
        </Button>
      </div>
    )
  }

  return null
}
