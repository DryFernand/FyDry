"use client";

import { NotificationItem } from "@/components/dashboard/types";

const SENT_ALERTS_STORAGE_KEY = "fydry_sent_native_alert_ids";

// Set en memoria para deduplicación instantánea síncrona
const inMemoryDispatchedIds = new Set<string>();

/**
 * Obtiene el conjunto de IDs de alertas que ya fueron emitidas en este dispositivo.
 */
function getDispatchedAlertIds(): Set<string> {
  if (typeof window === "undefined") return inMemoryDispatchedIds;
  try {
    const raw = localStorage.getItem(SENT_ALERTS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => inMemoryDispatchedIds.add(id));
      }
    }
  } catch (err) {
    console.warn("Error reading dispatched alert IDs:", err);
  }
  return inMemoryDispatchedIds;
}

/**
 * Guarda el ID de una alerta para que nunca más se vuelva a emitir en este dispositivo.
 */
function saveDispatchedAlertId(id: string) {
  inMemoryDispatchedIds.add(id);
  if (typeof window === "undefined") return;
  try {
    const arr = Array.from(inMemoryDispatchedIds).slice(-200);
    localStorage.setItem(SENT_ALERTS_STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn("Error saving dispatched alert ID:", err);
  }
}

/**
 * Registra el Service Worker de FyDry para notificaciones push en segundo plano.
 */
export async function registerFyDryServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.warn("ServiceWorker registration failed:", err);
    return null;
  }
}

/**
 * Solicita permisos de notificación nativa al usuario y registra el Service Worker.
 */
export async function requestSystemNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    await registerFyDryServiceWorker();

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
 * Dispara una notificación nativa del sistema operativo en PC o Celular con tag único anti-duplicado.
 */
export function triggerSystemNotification(title: string, body: string, tag: string): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const notifTag = tag || `fydry-${title.replace(/\s+/g, "_")}`;

    // Si hay un Service Worker registrado, usar showNotification para soporte con web cerrada y móvil
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: notifTag,
          vibrate: [200, 100, 200],
        } as NotificationOptions);
      });
      return true;
    }

    // Fallback: Web Notification estándar para PC
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: notifTag,
    });
    return true;
  } catch (err) {
    console.warn("Error sending native notification:", err);
    return false;
  }
}

/**
 * Procesa la lista de alertas y envía notificación nativa ÚNICAMENTE a las nuevas
 * que no hayan sido emitidas previamente en este dispositivo.
 */
export function dispatchNativeAlerts(notifications: NotificationItem[]) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const dispatchedIds = getDispatchedAlertIds();
  const unreadAlerts = notifications.filter((n) => !n.isRead && !n.isProcessed);

  unreadAlerts.forEach((item) => {
    // Si ya fue despachada anteriormente, no volver a disparar
    if (!dispatchedIds.has(item.id)) {
      // Bloquear inmediatamente en memoria antes del dispatch
      saveDispatchedAlertId(item.id);
      triggerSystemNotification(item.title, item.message, item.id);
    }
  });
}
