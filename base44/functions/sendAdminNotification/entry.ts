import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Admin-only broadcast: sends an in-app Notification to a single user or to
// every user. Each created Notification record triggers the "Notification
// Push" workflow, which delivers the native iOS/Android push — so this
// function only creates the records and lets the workflow fan out the push.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller || caller.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const target = String(body?.target || "user"); // "all" | "user"
    const userId = body?.user_id ? String(body.user_id) : null;
    const title = String(body?.title || "").slice(0, 100).trim();
    const text = String(body?.body || "").slice(0, 500).trim();

    if (!title || !text) {
      return Response.json({ error: "Title and body are required" }, { status: 400 });
    }
    if (target === "user" && !userId) {
      return Response.json({ error: "Recipient is required" }, { status: 400 });
    }

    // Resolve recipient user ids.
    let recipientIds = [];
    if (target === "user") {
      recipientIds = [userId];
    } else {
      const users = await base44.asServiceRole.entities.User.list("-created_date", 5000);
      recipientIds = (users || []).map((u) => u.id).filter(Boolean);
    }

    if (recipientIds.length === 0) {
      return Response.json({ error: "No recipients" }, { status: 400 });
    }

    // Build notification records. actor_name becomes the push title and text
    // becomes the push body (per the Notification Push workflow mapping).
    const records = recipientIds.map((uid) => ({
      user_id: uid,
      type: "admin_message",
      text,
      actor_name: title,
      actor_id: caller.id,
      read: false,
    }));

    const BATCH = 500;
    for (let i = 0; i < records.length; i += BATCH) {
      await base44.asServiceRole.entities.Notification.bulkCreate(records.slice(i, i + BATCH));
    }

    return Response.json({ ok: true, sent: recipientIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}