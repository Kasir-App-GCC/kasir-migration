import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Public browsing/SEO: unauthenticated callers are allowed, but get a safe
    // subset (no contact details) so WhatsApp numbers can't be indexed.
    const user = await base44.auth.me().catch(() => null);
    const isAuthed = !!user;

    const body = await req.json().catch(() => ({}));
    const userId = (body.user_id || "").toString();
    if (!userId) return Response.json({ error: "user_id required" }, { status: 400 });

    const u = await base44.asServiceRole.entities.User.get(userId);
    if (!u) return Response.json({ error: "not found" }, { status: 404 });

    // Aggregate the user's ratings so callers (feed cards, chat, profile) can
    // display their seller rating without a separate round-trip per card.
    let rating_avg = 0;
    let rating_count = 0;
    try {
      const ratings = await base44.asServiceRole.entities.Rating.filter(
        { rated_user_id: userId },
        "-created_date",
        200
      );
      rating_count = ratings?.length || 0;
      if (rating_count) {
        const sum = ratings.reduce((s, r) => s + (Number(r.score) || 0), 0);
        rating_avg = Math.round((sum / rating_count) * 10) / 10;
      }
    } catch {}

    const safe = {
      username: u.username || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      full_name: u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" "),
      avatar: u.avatar || "",
      is_trusted: !!u.is_trusted,
      re_license_status: u.re_license_status || "",
      re_license_type: u.re_license_type || "",
      rating_avg,
      rating_count,
      created_date: u.created_date || null,
      followers_override: typeof u.followers_override === "number" ? u.followers_override : null,
    };
    return Response.json(
      isAuthed
        ? { ...safe, whatsapp_enabled: !!u.whatsapp_enabled, whatsapp_number: u.whatsapp_enabled ? (u.whatsapp_number || "") : "" }
        : { ...safe, whatsapp_enabled: false, whatsapp_number: "" }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}