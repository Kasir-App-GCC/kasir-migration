import { base44 } from "@/api/base44Client";
import { fetchMyChatData } from "@/lib/chatData";
import { playBeep } from "@/lib/beep";

// Singleton unread-chat counter + chat-data cache. Both the bottom-nav badge
// and the notification bell (via useUnreadBell) read from this one source, so
// the heavy fetchMyChatData + realtime subscriptions run exactly once per user
// instead of being duplicated across two consumers (the old setup fired ~8
// backend calls on every page load, twice). The cached snapshot is also
// reused by the notifications panel so opening the bell doesn't re-fetch all
// chats a third time.

function offerIsIncoming(o, userId) {
  if (!o || !userId) return false;
  if (o.direction === "buyer_offer") return o.seller_id === userId;
  if (o.direction === "seller_counter") return o.buyer_id === userId;
  return false;
}

let activeUserId = null;
let count = 0;
let lastSnapshot = null; // { rooms, messages, offers, roomMap }
const listeners = new Set();
let inFlight = false;
let timer = null;
let unsubM = null, unsubO = null, unsubR = null;
let roomIds = new Set();
let refCount = 0;

function emit() {
  listeners.forEach((cb) => cb(count));
}

async function compute() {
  if (!activeUserId || inFlight) return;
  inFlight = true;
  try {
    const data = await fetchMyChatData({ id: activeUserId });
    lastSnapshot = data;
    const { rooms: mine, messages: msgs, offers } = data;
    roomIds = new Set(mine.map((r) => r.id));
    let total = 0;
    mine.forEach((r) => {
      const myLastSeen = r.seller_id === activeUserId ? r.seller_last_seen : r.buyer_last_seen;
      const since = myLastSeen ? new Date(myLastSeen).getTime() : 0;
      total += (msgs || []).filter(
        (m) => m.chatroom_id === r.id && m.sender_id !== activeUserId && new Date(m.created_date).getTime() > since
      ).length;
      total += (offers || []).filter(
        (o) => o.chatroom_id === r.id && offerIsIncoming(o, activeUserId) && new Date(o.created_date).getTime() > since
      ).length;
    });
    count = total;
    emit();
  } catch {} finally {
    inFlight = false;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => compute(), 400);
}

function maybeBeep(chatroomId) {
  if (window.location.pathname.startsWith("/chat/" + chatroomId)) return;
  playBeep();
}

function setup(user) {
  teardown();
  activeUserId = user?.id || null;
  if (!activeUserId) { count = 0; roomIds = new Set(); lastSnapshot = null; emit(); return; }
  compute();
  unsubM = base44.entities.Message.subscribe((event) => {
    const m = event && event.data;
    if (!m || m.sender_id === activeUserId) return;
    if (event.type === "create" && roomIds.has(m.chatroom_id)) {
      maybeBeep(m.chatroom_id);
      if (!window.location.pathname.startsWith("/chat/" + m.chatroom_id)) {
        count += 1; emit();
      }
      // Debounced background refresh keeps the cached snapshot fresh for the
      // notifications panel without an extra per-message fetch.
      schedule();
      return;
    }
    schedule();
  });
  unsubO = base44.entities.Offer.subscribe((event) => {
    const o = event && event.data;
    if (!o) return;
    if (event.type === "create" && offerIsIncoming(o, activeUserId) && roomIds.has(o.chatroom_id)) {
      maybeBeep(o.chatroom_id);
      if (!window.location.pathname.startsWith("/chat/" + o.chatroom_id)) {
        count += 1; emit();
      }
      schedule();
      return;
    }
    schedule();
  });
  unsubR = base44.entities.ChatRoom.subscribe((event) => {
    if (!event || !event.data) return;
    if (event.type === "create") schedule();
  });
}

function teardown() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (unsubM) { unsubM(); unsubM = null; }
  if (unsubO) { unsubO(); unsubO = null; }
  if (unsubR) { unsubR(); unsubR = null; }
  inFlight = false;
}

// Reference-counted: the fetch + subscriptions only run while at least one
// reader is mounted. The last reader unmounting tears everything down so we
// don't poll in the background on pages that don't show a badge.
export function subscribeUnreadChats(user, cb) {
  const userId = user?.id || null;
  if (userId !== activeUserId) {
    teardown();
    setup(user);
  }
  refCount++;
  listeners.add(cb);
  cb(count);
  return () => {
    listeners.delete(cb);
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) {
      teardown();
      activeUserId = null;
      count = 0;
      lastSnapshot = null;
    }
  };
}

// Last fetched chat data — reused by the notifications panel so opening the
// bell doesn't trigger a third full chat fetch.
export function getChatSnapshot() {
  return lastSnapshot;
}

export function recomputeUnreadChats() {
  schedule();
}