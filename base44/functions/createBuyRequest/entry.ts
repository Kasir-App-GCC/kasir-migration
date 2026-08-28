import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Server-side BuyRequest creation with per-user/per-hour throttling.
// Max 10 buy requests per hour per user.

const THROTTLE_WINDOW_MS = 60 * 60 * 1000;
const THROTTLE_MAX = 10;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    // Throttle check
    const since = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString();
    const recent = await base44.asServiceRole.entities.BuyRequest.filter(
      { user_id: user.id, created_date: { $gte: since } },
      "-created_date",
      THROTTLE_MAX + 1
    );
    if (recent && recent.length >= THROTTLE_MAX) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    const data: Record<string, any> = { ...body.data, user_id: user.id };
    if (!data.user_name && user.name) data.user_name = user.name;
    if (!data.user_avatar && user.avatar) data.user_avatar = user.avatar;

    const created = await base44.asServiceRole.entities.BuyRequest.create(data);
    return Response.json({ ok: true, request: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}