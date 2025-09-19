"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      console.log("Service Worker registrado:", registration)

      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
      console.log("Suscripción actual:", sub)
    } catch (error) {
      console.error("Error registrando Service Worker:", error)
      setStatus("Error registrando Service Worker")
    }
  }

  async function subscribeToPush() {
    setIsLoading(true)
    setStatus("Suscribiendo...")

    try {
      const registration = await navigator.serviceWorker.ready
      console.log("Service Worker listo")

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        throw new Error("VAPID public key no encontrada")
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      console.log("Nueva suscripción:", sub)
      setSubscription(sub)

      // Enviar suscripción al servidor
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!response.ok) {
        throw new Error("Error enviando suscripción al servidor")
      }

      setStatus("¡Suscrito exitosamente!")
    } catch (error) {
      console.error("Error suscribiendo:", error)
      setStatus(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    setStatus("Desuscribiendo...")

    try {
      if (subscription) {
        await subscription.unsubscribe()
        console.log("Desuscrito localmente")
      }

      // Notificar al servidor
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
      })

      setSubscription(null)
      setStatus("Desuscrito exitosamente")
    } catch (error) {
      console.error("Error desuscribiendo:", error)
      setStatus(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return

    setIsLoading(true)
    setStatus("Enviando notificación...")

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!response.ok) {
        throw new Error("Error enviando notificación")
      }

      setMessage("")
      setStatus("¡Notificación enviada!")
    } catch (error) {
      console.error("Error enviando notificación:", error)
      setStatus(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card className="fixed bottom-4 left-4 w-80 z-50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">Las notificaciones push no son compatibles con este navegador.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">🔔 Notificaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscription ? (
          <>
            <p className="text-sm text-green-600">✅ Notificaciones activadas</p>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Mensaje de prueba"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={sendTestNotification}
                  disabled={isLoading || !message.trim()}
                  size="sm"
                  className="flex-1"
                >
                  🧪 Probar
                </Button>
                <Button onClick={unsubscribeFromPush} disabled={isLoading} variant="outline" size="sm">
                  ❌
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Activa las notificaciones para recibir actualizaciones</p>
            <Button onClick={subscribeToPush} disabled={isLoading} className="w-full" size="sm">
              {isLoading ? "⏳ Activando..." : "🔔 Activar Notificaciones"}
            </Button>
          </>
        )}

        {status && <p className="text-xs text-gray-500 mt-2">{status}</p>}
      </CardContent>
    </Card>
  )
}
