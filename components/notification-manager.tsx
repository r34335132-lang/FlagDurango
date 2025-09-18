"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, AlertCircle } from "lucide-react"

export function NotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      checkSubscription()
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("Service Worker registered:", registration)
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  }

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
      console.log("Current subscription:", sub)
    } catch (error) {
      console.error("Error checking subscription:", error)
      setError("Error al verificar suscripción")
    }
  }

  const subscribeUser = async () => {
    setLoading(true)
    setError(null)

    try {
      // Solicitar permiso para notificaciones
      const permission = await Notification.requestPermission()
      console.log("Notification permission:", permission)

      if (permission !== "granted") {
        throw new Error("Permiso de notificaciones denegado")
      }

      const registration = await navigator.serviceWorker.ready
      console.log("Service Worker ready:", registration)

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log("VAPID Public Key:", publicKey)

      if (!publicKey) {
        throw new Error("VAPID public key no configurada")
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      console.log("New subscription:", sub)

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sub.toJSON()),
      })

      const data = await response.json()
      console.log("Subscribe response:", data)

      if (data.success) {
        setSubscription(sub)

        // Enviar notificación de bienvenida
        await fetch("/api/notifications/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "🏈 Liga Flag Durango",
            body: "¡Notificaciones activadas! Te avisaremos de partidos en vivo y resultados.",
            url: "/",
          }),
        })

        alert("¡Notificaciones activadas correctamente!")
      } else {
        throw new Error(data.error || "Error al activar notificaciones")
      }
    } catch (error: any) {
      console.error("Error subscribing:", error)
      setError(error.message)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeUser = async () => {
    setLoading(true)
    setError(null)

    try {
      if (subscription) {
        await subscription.unsubscribe()

        const response = await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        const data = await response.json()

        if (data.success) {
          setSubscription(null)
          alert("Notificaciones desactivadas correctamente.")
        } else {
          throw new Error(data.error || "Error al desactivar notificaciones")
        }
      }
    } catch (error: any) {
      console.error("Error unsubscribing:", error)
      setError(error.message)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testNotification = async () => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "🧪 Notificación de Prueba",
          body: "Esta es una notificación de prueba del sistema Liga Flag Durango",
          url: "/partidos",
        }),
      })

      const data = await response.json()
      console.log("Test notification response:", data)

      if (data.success) {
        alert("Notificación de prueba enviada!")
      } else {
        alert(`Error enviando notificación: ${data.error}`)
      }
    } catch (error) {
      console.error("Error sending test notification:", error)
      alert("Error enviando notificación de prueba")
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

  if (!isSupported) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm">Notificaciones no soportadas</div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {error && (
        <div className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-2">
        {subscription ? (
          <>
            <Button
              onClick={unsubscribeUser}
              disabled={loading}
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white border-red-500"
            >
              <BellOff className="w-4 h-4 mr-2" />
              {loading ? "..." : "Desactivar"}
            </Button>
            <Button onClick={testNotification} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
              🧪 Probar
            </Button>
          </>
        ) : (
          <Button
            onClick={subscribeUser}
            disabled={loading}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Bell className="w-4 h-4 mr-2" />
            {loading ? "Activando..." : "Activar Notificaciones"}
          </Button>
        )}
      </div>
    </div>
  )
}
