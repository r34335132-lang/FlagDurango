"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"

export function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)

      // Show prompt if notifications are default and user hasn't dismissed it
      const hasSeenPrompt = localStorage.getItem("notification-prompt-seen")
      if (Notification.permission === "default" && !hasSeenPrompt) {
        setShowPrompt(true)
      }

      // Check if already subscribed
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error("Error checking subscription:", error)
      }
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        await subscribeToNotifications()
      }

      setShowPrompt(false)
      localStorage.setItem("notification-prompt-seen", "true")
    }
  }

  const subscribeToNotifications = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready

        // You would need to generate VAPID keys and add your public key here
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "your-vapid-public-key"

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        })

        // Send subscription to your server
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscription }),
        })

        setIsSubscribed(true)
        console.log("Successfully subscribed to notifications")
      } catch (error) {
        console.error("Error subscribing to notifications:", error)
      }
    }
  }

  const unsubscribeFromNotifications = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          await subscription.unsubscribe()

          // Notify your server
          await fetch("/api/notifications/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ subscription }),
          })
        }

        setIsSubscribed(false)
        console.log("Successfully unsubscribed from notifications")
      } catch (error) {
        console.error("Error unsubscribing from notifications:", error)
      }
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem("notification-prompt-seen", "true")
  }

  if (!("Notification" in window)) {
    return null
  }

  if (showPrompt && permission === "default") {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1 flex items-center">
                  <Bell className="w-4 h-4 mr-1" />
                  ¡Activa las Notificaciones!
                </h3>
                <p className="text-xs text-orange-100 mb-3">
                  Recibe alertas cuando inicien los partidos y cuando terminen
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={requestNotificationPermission}
                    size="sm"
                    className="bg-white text-orange-600 hover:bg-orange-50 text-xs"
                  >
                    Activar
                  </Button>
                  <Button
                    onClick={dismissPrompt}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 text-xs"
                  >
                    Ahora no
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show notification status for granted permissions
  if (permission === "granted") {
    return (
      <div className="fixed top-4 right-4 z-40">
        <Button
          onClick={isSubscribed ? unsubscribeFromNotifications : subscribeToNotifications}
          size="sm"
          variant={isSubscribed ? "default" : "outline"}
          className="shadow-lg"
        >
          {isSubscribed ? (
            <>
              <Bell className="w-4 h-4 mr-1" />
              Notificaciones ON
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 mr-1" />
              Activar Notificaciones
            </>
          )}
        </Button>
      </div>
    )
  }

  return null
}
