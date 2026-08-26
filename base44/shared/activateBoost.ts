// Shared boost activation logic used by confirmBoostPayment (webhook + client
// redirect) and syncBoostPayments (Moyasar API reconciliation). Idempotent:
// re-running on an already-approved BoostRequest is a no-op. The item's
// featured window is only ever extended, never shortened, so a re-confirmation
// after an active boost can't devalue a paid promotion.
export async function activateBoost(base44, opts: {
  requestId?: string;
  itemId?: string;
  hours?: number;
  userId?: string;
  paymentId?: string;
  invoiceId?: string;
}): Promise<{ activated: boolean; already: boolean }> {
  const requestId = (opts.requestId || "").trim();
  const itemId = (opts.itemId || "").trim();
  const hours = Math.max(0, Math.floor(Number(opts.hours) || 0));
  const receiptRef = "moyasar:" + (opts.paymentId || opts.invoiceId || "");

  let request: any = null;
  if (requestId) {
    try { request = await base44.asServiceRole.entities.BoostRequest.get(requestId); } catch { request = null; }
  }

  // Idempotency: if already approved, the boost is already live.
  if (request && request.status === "approved") {
    return { activated: false, already: true };
  }

  if (request) {
    await base44.asServiceRole.entities.BoostRequest.update(request.id, {
      status: "approved",
      reviewed_by: "system",
      receipt_url: receiptRef,
    });
  } else if (itemId) {
    const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
    request = await base44.asServiceRole.entities.BoostRequest.create({
      item_id: itemId,
      item_title: item?.title || "",
      user_id: opts.userId || "",
      user_name: "",
      hours,
      cross_country: false,
      amount: 0,
      status: "approved",
      reviewed_by: "system",
      receipt_url: receiptRef,
    });
  }

  // Activate the boost on the item. Only extend the featured window if the
  // new boost pushes it further out than an existing active boost — never
  // shorten a paid promotion.
  const boostHours = request?.hours || hours;
  if (itemId && boostHours > 0) {
    const item = await base44.asServiceRole.entities.Item.get(itemId).catch(() => null);
    const until = new Date(Date.now() + boostHours * 3600 * 1000).toISOString();
    const existingUntil = item?.featured_until ? new Date(item.featured_until).getTime() : 0;
    const featuredUntil = new Date(until).getTime() > existingUntil ? until : item.featured_until;
    await base44.asServiceRole.entities.Item.update(itemId, {
      featured: true,
      featured_until: featuredUntil,
    });
  }

  const notifyUserId = opts.userId || request?.user_id || "";
  if (notifyUserId) {
    try {
      // Boosts are fully automated (no admin review), so skip the confirmation
      // notification for admin accounts — only the end user gets a "your boost
      // is live" notice.
      const notifyUser = await base44.asServiceRole.entities.User.get(notifyUserId).catch(() => null);
      if (notifyUser?.role !== "admin") {
        await base44.asServiceRole.entities.Notification.create({
          user_id: notifyUserId,
          type: "boost_approved",
          item_id: itemId,
          item_title: request?.item_title || "",
          text: "تم تفعيل تعزيز إعلانك ⭐",
        });
      }
    } catch (e) {}
  }

  return { activated: true, already: false };
}