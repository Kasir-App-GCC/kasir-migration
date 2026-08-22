import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Maintains the per-listing favorites_count as the service role. As with views,
// a buyer toggling favorite on someone else's listing could not update the
// item (RLS blocks non-sellers), so the count was frozen. The favorites list
// itself stays client-side (localStorage); this function only keeps the
// public counter in sync.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id;
    const action = body?.action; // "add" | "remove"
    if (!itemId) return Response.json({ error: 'item_id is required' }, { status: 400 });
    if (!['add', 'remove'].includes(action)) return Response.json({ error: 'Invalid action' }, { status: 400 });

    const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    const cur = Number(item.favorites_count) || 0;
    const next = action === 'add' ? cur + 1 : Math.max(0, cur - 1);
    if (next !== cur) {
      await base44.asServiceRole.entities.Item.update(itemId, { favorites_count: next });
    }
    return Response.json({ ok: true, favorites_count: next });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}