"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/app/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status =
  | "checking"
  | "unsupported"
  | "needs-install" // iOS Safari, not added to home screen yet
  | "subscribed"
  | "unsubscribed"
  | "denied";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (isIos && !isStandalone) {
          setStatus("needs-install");
        } else {
          setStatus("unsupported");
        }
        return;
      }

      if (isIos && !isStandalone) {
        setStatus("needs-install");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    }
    check().catch(() => setStatus("unsupported"));
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Push notifications aren't configured (missing VAPID key).");
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const result = await subscribeToPush({
        endpoint: json.endpoint,
        keys: json.keys,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") return null;

  if (status === "needs-install") {
    return (
      <p className="text-xs text-muted">
        To get hearing alerts on iPhone: tap the Share icon in Safari, then{" "}
        <strong>Add to Home Screen</strong>. Open the app from your home
        screen, then come back here to enable notifications.
      </p>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="text-xs text-muted">
        Push notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-xs text-red-600">
        Notifications are blocked for this site. Enable them in your
        browser/phone settings to get hearing alerts.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={status === "subscribed" ? handleUnsubscribe : handleSubscribe}
        disabled={busy}
        className="rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover disabled:opacity-50"
      >
        {busy
          ? "Working…"
          : status === "subscribed"
            ? "Disable hearing alerts"
            : "Enable hearing alerts"}
      </button>
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
