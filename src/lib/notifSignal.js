// Lightweight pub-sub so useNotifications (which bulk-marks notifications as
// read via updateMany) can tell useUnreadBell to recompute its badge count.
// updateMany doesn't fire per-record realtime events, so without this signal
// the bell badge would stay after the user opens the notifications panel.
const listeners = new Set();

export function onNotifsRead(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitNotifsRead() {
  listeners.forEach((cb) => cb());
}