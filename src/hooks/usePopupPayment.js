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

const CHECKOUT_WINDOW_NAME = "moyasar_checkout";

// Open a blank checkout popup synchronously during a user gesture so the
// browser doesn't block it. Call this BEFORE the async backend call that
// produces the checkout URL — usePopupPayment.start() later navigates this
// same named window to the real URL. Returns false if the popup was blocked.
export function openCheckoutBlank() {
  const w = 460, h = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open("", CHECKOUT_WINDOW_NAME, `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`);
  if (!popup) return false;
  try {
    popup.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>...</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,-apple-system,sans-serif;color:#64748b;background:#f8fafc}.b{text-align:center}.s{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#f59e0b;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 14px}@keyframes sp{to{transform:rotate(360deg)}}</style></head><body><div class="b"><div class="s"></div>جارٍ تجهيز الدفع…<br>Loading payment…</div></body></html>`);
    popup.document.close();
  } catch {}
  return true;
}

// Close the checkout popup if it's still open (e.g. the backend call failed
// after openCheckoutBlank already opened it). No-op if no popup exists.
export function closeCheckoutPopup() {
  try {
    const w = window.open("", CHECKOUT_WINDOW_NAME);
    if (w && !w.closed) w.close();
  } catch {}
}

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
    const popup = window.open(url, CHECKOUT_WINDOW_NAME, `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`);
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
        // A paid payment may appear before the invoice `status` field flips to
        // "paid" (Moyasar API lag) — treat either as success so the popup
        // closes promptly when the transaction is actually finished.
        const isPaid = r.status === "paid" || !!r.payment_id;
        if (isPaid) {
          stopPolling();
          closedByUsRef.current = true;
          try { popupRef.current?.close(); } catch {}
          setState("paid");
          // Include the invoice id so callers can confirm/record the payment
          // server-side without re-deriving it from the checkout URL.
          onSuccess?.({ ...r, invoice_id: invId });
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
    }, 1500);
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