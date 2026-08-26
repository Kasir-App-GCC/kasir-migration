import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// One-time free 1-day boost reward for verified users.
// Abuse guard: only ONE free boost per user (lifetime), enforced by checking
// for any existing is_free BoostRequest. Auto-activates the featured clock
// (no payment, no admin review) for 24 hours in the seller's own country.
const FREE_BOOST_HOURS = 24;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.is_trusted)
      return Response.json({ error: "Verification required for the free boost" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const itemId = (body.item_id || "").toString();
    if (!itemId) return Response.json({ error: "item_id is required" }, { status: 400 });

    const item = await base44.entities.Item.get(itemId);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
    if (item.seller_id !== user.id && item.created_by_id !== user.id)
      return Response.json({ error: "Not allowed" }, { status: 403 });

    // Abuse guard: one free boost per user, lifetime.
    const already = await base44.entities.BoostRequest.filter(
      { user_id: user.id, is_free: true },
      "-created_date",
      1
    );
    if (already && already.length > 0)
      return Response.json({ error: "You've already used your free boost" }, { status: 409 });

    const userName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username || user.full_name || user.email || "";

    const until = new Date(Date.now() + FREE_BOOST_HOURS * 3600 * 1000).toISOString();
    // Only extend the featured window if the free boost pushes it further out
    // than an existing active boost — never shorten a paid promotion.
    const existingUntil = item.featured_until ? new Date(item.featured_until).getTime() : 0;
    const featuredUntil = new Date(until).getTime() > existingUntil ? until : item.featured_until;

    await base44.asServiceRole.entities.Item.update(itemId, {
      featured: true,
      featured_until: featuredUntil,
    });

    await base44.entities.BoostRequest.create({
      item_id: item.id,
      item_title: item.title,
      user_id: user.id,
      user_name: userName,
      hours: FREE_BOOST_HOURS,
      cross_country: false,
      amount: 0,
      status: "approved",
      is_free: true,
      reviewed_by: "system",
    });

    // Boosts are fully automated now (no admin review), so don't notify admin
    // accounts about their own boosts — only the end user gets a confirmation.
    if (user.role !== "admin") {
      try {
        await base44.entities.Notification.create({
          user_id: user.id,
          type: "boost_approved",
          item_id: item.id,
          item_title: item.title,
          text: "Your free 1-day boost is live! 🎁",
        });
      } catch {}
    }

    return Response.json({ ok: true, featured_until: featuredUntil });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}