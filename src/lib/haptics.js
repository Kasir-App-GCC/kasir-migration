// Lightweight haptic feedback wrapper. Guards navigator.vibrate existence
// (not supported on iOS Safari / desktop). Call on tactile success actions
// like favorite, offer submit, and offer accept for a more native feel.
export function haptic(ms = 10) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(ms);
    }
  } catch {}
}