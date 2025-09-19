"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, TestTube } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })

      console.log("Service Worker registered:", registration)

      // Esperar a que esté listo
      await navigator.serviceWorker.ready

      // Verificar suscripción existente
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)

      if (sub) {
        console.log("Existing subscription found:", sub)
      }
    } catch (error) {
      console.error("Error registering service worker:", error)
    }
  }

  async function subscribeToPush() {
    setIsLoading(true)
    setStatus("Solicitando permisos...")

    try {
      // Solicitar permiso explícitamente
      const permission = await Notification.requestPermission()
      console.log("Notification permission:", permission)

      if (permission !== "granted") {
        throw new Error("Permiso de notificaciones denegado. Por favor, permite las notificaciones en tu navegador.")
      }

      setStatus("Configurando notificaciones...")

      const registration = await navigator.serviceWorker.ready
      console.log("Service Worker ready for subscription")

      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f53NlqKOYWsSBhjuXPiQfzuVAl9Hs4HcKSVdJiKz0g5JwQw5Y8g"

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      console.log("New subscription created:", sub)
      setSubscription(sub)

      setStatus("Guardando suscripción...")

      // Enviar suscripción al servidor
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })

      const result = await response.json()
      console.log("Subscribe response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la suscripción")
      }

      setStatus("¡Notificaciones activadas correctamente!")

      // Enviar notificación de bienvenida
      setTimeout(async () => {
        try {
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "🏈 Liga Flag Durango",
              body: "¡Notificaciones activadas! Recibirás actualizaciones de partidos y resultados.",
              url: "/partidos",
            }),
          })
        } catch (error) {
          console.error("Error sending welcome notification:", error)
        }
      }, 1000)
    } catch (error: any) {
      console.error("Error subscribing:", error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    setStatus("Desactivando notificaciones...")

    try {
      if (subscription) {
        await subscription.unsubscribe()
        console.log("Unsubscribed locally")

        // Notificar al servidor
        const response = await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        if (response.ok) {
          console.log("Unsubscribed from server")
        }
      }

      setSubscription(null)
      setStatus("Notificaciones desactivadas")
    } catch (error: any) {
      console.error("Error unsubscribing:", error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    setIsLoading(true)
    setStatus("Enviando notificación de prueba...")

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🧪 Notificación de Prueba",
          body: "Esta es una prueba del sistema de notificaciones de Liga Flag Durango. ¡Funciona correctamente!",
          url: "/partidos",
        }),
      })

      const result = await response.json()
      console.log("Test notification response:", result)

      if (response.ok) {
        setStatus("¡Notificación de prueba enviada!")
      } else {
        throw new Error(result.error || "Error enviando notificación")
      }
    } catch (error: any) {
      console.error("Error sending test notification:", error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm">
        Notificaciones no soportadas en este navegador
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {status && (
        <div className="mb-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm max-w-xs shadow-lg">{status}</div>
      )}

      {subscription ? (
        <div className="flex flex-col space-y-2">
          <Button
            onClick={sendTestNotification}
            disabled={isLoading}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isLoading ? "Enviando..." : "🧪 Probar"}
          </Button>

          <Button
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg"
          >
            <BellOff className="w-4 h-4 mr-2" />
            {isLoading ? "..." : "Desactivar"}
          </Button>
        </div>
      ) : (
        <Button
          onClick={subscribeToPush}
          disabled={isLoading}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white shadow-lg"
        >
          <Bell className="w-4 h-4 mr-2" />
          {isLoading ? "Activando..." : "Activar Notificaciones"}
        </Button>
      )}
    </div>
  )
}
