import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { isInternalInvocation } from "../../shared/internalAuth.ts";

// Refreshes the per-country FeaturedRotation cache: a fair reservoir sample
// of ALL currently-active boosted listings (local + cross-country), so the
// Home featured carousel scales to any number of concurrent boosts (10K+)
// without fetching them all on every page load. Exposure is proportional to
// boost duration — a 7-day boost stays in the active pool 7x longer than a
// 1-day boost, so it's sampled across 7x more refresh windows.
//
// Invoked every ~15 min by the "Featured Rotation" scheduled workflow (internal
// service token). An admin can also trigger it manually for bootstrapping.
const SAMPLE_SIZE = 120;
const GCC = ["SA", "AE", "OM", "BH", "KW", "QA"];
const PAGE = 500;
const MAX_PAGES = 40; // safety cap = 20K active boosts

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Authorize: internal workflow invocation OR an admin user (manual trigger).
    let authorized = await isInternalInvocation(req);
    if (!authorized) {
      try {
        const me = await base44.auth.me();
        if (me && me.role === "admin") authorized = true;
      } catch {}
    }
    if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const nowIso = new Date().toISOString();
    // Per-country reservoir pools. Init all GCC countries so stale rotation
    // records are cleared even when a country has no active boosts right now.
    const pools: Record<string, { ids: string[]; count: number }> = {};
    for (const c of GCC) pools[c] = { ids: [], count: 0 };
    const add = (c: string, id: string) => {
      const p = pools[c] || (pools[c] = { ids: [], count: 0 });
      p.count++;
      if (p.ids.length < SAMPLE_SIZE) p.ids.push(id);
      else {
        const r = Math.floor(Math.random() * p.count); // prob K/i
        if (r < SAMPLE_SIZE) p.ids[r] = id;
      }
    };

    // Paginate all active featured listings (keyset cursor on created_date).
    let cursor: string | null = null;
    let pages = 0;
    let totalSeen = 0;
    while (pages < MAX_PAGES) {
      const query: any = {
        featured: true,
        featured_until: { $gt: nowIso },
        archived: { $ne: true },
        review_status: { $nin: ["pending", "rejected"] },
      };
      if (cursor) query.created_date = { $lt: cursor };
      const batch = await base44.asServiceRole.entities.Item.filter(query, "-created_date", PAGE);
      const list: any[] = batch || [];
      if (!list.length) break;
      totalSeen += list.length;
      for (const it of list) {
        const c = it.country || "SA";
        add(c, it.id);
        // Cross-country boosts appear in every other GCC country's pool too.
        if (it.featured_cross_country) {
          for (const other of GCC) if (other !== c) add(other, it.id);
        }
      }
      cursor = list[list.length - 1].created_date;
      pages++;
      if (list.length < PAGE) break; // no more pages
    }

    // Upsert a rotation record per country (clears stale entries).
    let upserted = 0;
    for (const [country, p] of Object.entries(pools)) {
      const existing = await base44.asServiceRole.entities.FeaturedRotation.filter({ country }, "-updated_date", 1);
      if (existing && existing.length) {
        await base44.asServiceRole.entities.FeaturedRotation.update(existing[0].id, {
          sample_ids: p.ids,
          count_active: p.count,
          refreshed_at: nowIso,
        });
      } else {
        await base44.asServiceRole.entities.FeaturedRotation.create({
          country,
          sample_ids: p.ids,
          count_active: p.count,
          refreshed_at: nowIso,
        });
      }
      upserted++;
    }

    return Response.json({ ok: true, scanned: totalSeen, pages, upserted, countries: Object.keys(pools) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}