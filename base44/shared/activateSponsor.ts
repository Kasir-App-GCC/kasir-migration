// Shared sponsorship activation, used by confirmSponsorPayment (webhook +
// client invoke). Idempotent: re-running on an already-sponsored item only
// extends the window further out — never shortens a paid sponsorship.
// Sets admin_sponsored + admin_sponsored_until so the item pins to the top
// of the Home feed with the "Sponsored" badge (same fields the admin panel
// uses), so no new feed logic is needed. Also marks the SponsorRequest (if
// provided) as "paid" so the admin board reflects completion.
export async function activateSponsor(base44, opts: {
  itemId?: string;
  weeks?: number;
  userId?: string;
  paymentId?: string;
  requestId?: string;
}): Promise<{ activated: boolean; already: boolean }> {
  const itemId = (opts.itemId || "").trim();
  const weeks = Math.max(0, Math.floor(Number(opts.weeks) || 0));
  if (!itemId || weeks <= 0) return { activated: false, already: false };

  const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
  if (!item) return { activated: false, already: false };

  const until = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000).toISOString();
  const existingUntil = item.admin_sponsored_until ? new Date(item.admin_sponsored_until).getTime() : 0;
  const sponsoredUntil = new Date(until).getTime() > existingUntil ? until : item.admin_sponsored_until;

  await base44.asServiceRole.entities.Item.update(itemId, {
    admin_sponsored: true,
    admin_sponsored_until: sponsoredUntil,
  });

  // Mark the originating request as paid (idempotent — only updates if still approved).
  const requestId = (opts.requestId || "").trim();
  if (requestId) {
    try {
      const req = await base44.asServiceRole.entities.SponsorRequest.get(requestId).catch(() => null);
      if (req && req.status === "approved") {
        await base44.asServiceRole.entities.SponsorRequest.update(requestId, { status: "paid" });
      }
    } catch (e) {}
  }

  const notifyUserId = opts.userId || "";
  if (notifyUserId) {
    try {
      const notifyUser = await base44.asServiceRole.entities.User.get(notifyUserId).catch(() => null);
      if (notifyUser?.role !== "admin") {
        await base44.asServiceRole.entities.Notification.create({
          user_id: notifyUserId,
          type: "sponsor_activated",
          item_id: itemId,
          item_title: item.title || "",
          text: "تم تفعيل رعاية إعلانك 🚀",
        });
      }
    } catch (e) {}
  }

  return { activated: true, already: false };
}