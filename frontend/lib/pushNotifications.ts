"use client";

import { NotificationItem } from "@/components/dashboard/types";

/**
 * Solicita permisos de notificación nativa al usuario si aún no han sido concedidos.
 */
export async function requestSystemNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
  }
  return false;
}

/**
 * Dispara una notificación nativa del sistema operativo en PC o Celular.
 */
export function triggerSystemNotification(title: string, body: string, tag?: string): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    // Si hay un Service Worker registrado, usar showNotification para mejor compatibilidad móvil (Android/PWA)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: tag || `fydry-${Date.now()}`,
          vibrate: [200, 100, 200],
        } as NotificationOptions);
      });
      return true;
    }

    // Fallback: Web Notification estándar para PC / Escritorio
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: tag || `fydry-${Date.now()}`,
    });
    return true;
  } catch (err) {
    console.warn("Error sending native notification:", err);
    return false;
  }
}

/**
 * Procesa una lista de alertas y envía notificaciones nativas para las no leídas / nuevas.
 */
const sentAlertKeys = new Set<string>();

export function dispatchNativeAlerts(notifications: NotificationItem[]) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const unreadAlerts = notifications.filter((n) => !n.isRead && !n.isProcessed);

  unreadAlerts.forEach((item) => {
    if (!sentAlertKeys.has(item.id)) {
      sentAlertKeys.add(item.id);
      triggerSystemNotification(item.title, item.message, item.id);
    }
  });
}
