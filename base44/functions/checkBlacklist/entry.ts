import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // A 401/403 from me() can mean the account was deleted/revoked (admin
      // "block & delete") OR a transient token-refresh race / brief auth blip.
      // The old code immediately returned blocked:true on any 401/403, which
      // made a momentary blip flash a false "you were banned" screen to users
      // whose accounts were perfectly fine. Retry once before deciding — if
      // the retry succeeds it was transient; if it still 401s the session is
      // genuinely invalid and we signal the client to log out cleanly.
      if (e && (e.status === 401 || e.status === 403)) {
        await new Promise((r) => setTimeout(r, 800));
        try {
          user = await base44.auth.me();
        } catch (e2) {
          if (e2 && (e2.status === 401 || e2.status === 403)) {
            return Response.json({ session_invalid: true });
          }
          return Response.json({ blocked: false });
        }
      } else {
        // Transient network error (no HTTP status) — don't kick the user out.
        return Response.json({ blocked: false });
      }
    }
    if (!user) return Response.json({ blocked: false });

    // An admin can ban a user by setting is_banned on the User record.
    // Enforce it at the entry gate so banned users are blocked from the app
    // even when they were never added to the separate Blacklist entity.
    if (user.is_banned) {
      return Response.json({ blocked: true, reason: user.banned_reason || 'banned' });
    }

    // Soft-deleted users (disabled by the platform when hard-delete is blocked)
    // must not remain in the app either.
    if (user.disabled) {
      return Response.json({ blocked: true, reason: 'account_removed' });
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