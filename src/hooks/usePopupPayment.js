import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Popup + polling payment flow for Moyasar hosted-checkout (redirect) payments.
//
// Instead of `window.location.href = url` (which abandons the app and leaves the
// user stuck on Moyasar's "invoice paid" page), we open the checkout URL in a
// small popup window and poll the invoice status from inside the app. When the
// invoice flips to `paid`, we close the popup and invoke `onSuccess` so the
// caller can continue the action (show a success message, activate the boost,
// etc.). If the popup is blocked, we fall back to a full-page redirect.
//
// state: "idle" | "waiting" | "paid" | "failed" | "closed"

// Pulls the Moyasar invoice id out of a hosted-checkout URL
// (https://checkout.moyasar.com/invoices/<uuid>?lang=en).
export function extractInvoiceId(url) {
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\/invoices\/([^/?]+)/);
    if (m) return m[1];
  } catch {}
  return "";
}

export function usePopupPayment() {
  const [state, setState] = useState("idle");
  const popupRef = useRef(null);
  const pollRef = useRef(null);
  const closedByUsRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const start = useCallback(async ({ url, invoiceId, onSuccess, onFail, maxAttempts = 120 }) => {
    stopPolling();
    closedByUsRef.current = false;

    // Extract the invoice id from the checkout URL if the caller didn't pass it
    // (Moyasar URLs look like https://checkout.moyasar.com/invoices/<uuid>?lang=en).
    let invId = invoiceId;
    if (!invId) {
      try {
        const path = new URL(url).pathname;
        const m = path.match(/\/invoices\/([^/?]+)/);
        if (m) invId = m[1];
      } catch {}
    }
    if (!invId) {
      // Can't poll without an invoice id — fall back to a full redirect.
      window.location.href = url;
      return;
    }

    // Open a centered popup. If the browser blocks it, fall back to redirect.
    const w = 460, h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    const popup = window.open(url, "moyasar_checkout", `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`);
    if (!popup) {
      window.location.href = url;
      return;
    }
    popupRef.current = popup;
    setState("waiting");

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      // User closed the popup before paying → stop and surface as "closed".
      if (!closedByUsRef.current && popupRef.current && popupRef.current.closed) {
        stopPolling();
        setState("closed");
        onFail?.({ status: "closed" });
        return;
      }
      try {
        const res = await base44.functions.invoke("checkMoyasarInvoiceStatus", { invoice_id: invId });
        const r = res?.data || {};
        if (r.status === "paid") {
          stopPolling();
          closedByUsRef.current = true;
          try { popupRef.current?.close(); } catch {}
          setState("paid");
          onSuccess?.(r);
          return;
        }
        if (r.status === "failed") {
          stopPolling();
          setState("failed");
          onFail?.(r);
          return;
        }
      } catch {}
      if (attempts >= maxAttempts) {
        stopPolling();
        setState("closed");
        onFail?.({ status: "timeout" });
      }
    }, 3000);
  }, [stopPolling]);

  const cancel = useCallback(() => {
    stopPolling();
    closedByUsRef.current = true;
    try { popupRef.current?.close(); } catch {}
    setState("closed");
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState("idle");
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { state, start, cancel, reset };
}