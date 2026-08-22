import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isInternalInvocation } from '../../shared/internalAuth.ts';

// Unsets `featured` / `featured_cross_country` on listings whose boost period
// expired. Without this, the boolean stays true forever and any server-side
// query filtering on `featured: true` keeps surfacing expired boosts.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!isInternalInvocation(req)) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const nowIso = new Date().toISOString();
    const expired = await base44.asServiceRole.entities.Item.filter(
      { featured: true, featured_until: { $lt: nowIso } },
      '-created_date',
      500
    ).catch(() => []);
    let cleared = 0;
    if (expired && expired.length) {
      await base44.asServiceRole.entities.Item.updateMany(
        { featured: true, featured_until: { $lt: nowIso } },
        { $set: { featured: false, featured_cross_country: false } }
      ).catch(() => {});
      cleared = expired.length;
    }
    return Response.json({ ok: true, cleared });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}