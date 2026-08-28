import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { subscribeUnreadChats } from "@/lib/unreadStore";

// Thin reader over the shared unread-chat singleton (src/lib/unreadStore).
// Both the bottom-nav badge and the bell reuse this single source, so the
// heavy chat fetch + realtime subscriptions run once per user, not twice.
export default function useUnreadChats() {
  const { user } = useStore();
  const [count, setCount] = useState(0);
  useEffect(() => subscribeUnreadChats(user, setCount), [user]);
  return count;
}