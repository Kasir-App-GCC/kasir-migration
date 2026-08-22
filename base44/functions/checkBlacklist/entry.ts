import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // An admin can ban a user by setting is_banned on the User record.
    // Enforce it at the entry gate so banned users are blocked from the app
    // even when they were never added to the separate Blacklist entity.
    if (user.is_banned) {
      return Response.json({ blocked: true, reason: user.banned_reason || 'banned' });
    }

    const entries = await base44.asServiceRole.entities.Blacklist.list("-created_date", 500);
    const email = (user.email || "").toLowerCase().trim();
    const phone = (user.phone || "").replace(/\D/g, "");

    const match = (entries || []).find((e) => {
      if (e.email && e.email.toLowerCase() === email) return true;
      if (e.phone && phone && e.phone.replace(/\D/g, "") === phone) return true;
      return false;
    });

    return Response.json({ blocked: !!match, reason: match?.reason || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}