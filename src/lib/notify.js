import { base44 } from "@/api/base44Client";

// Fire-and-forget native push notification. No-ops on web / until the mobile
// build has push credentials. Always resolves (never throws) so it can't
// break the calling flow.
export function sendPush({ user_id, title, content, action_url, action_label }) {
  if (!user_id || !title || !content) return Promise.resolve();
  return base44.functions
    .invoke("sendPushNotification", { user_id, title, content, action_url, action_label })
    .catch(() => {});
}