import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import ListingForm from "@/components/ListingForm";
import BoostPopupPayment from "@/components/BoostPopupPayment";
import { base44Analytics } from "@/lib/analytics";

// Shared seller fields attached to every item (draft or published).
const sellerFields = (user) => ({
  seller_id: user?.id,
  seller_name: user?.name,
  seller_avatar: user?.avatar || null,
  seller_trusted: !!user?.is_trusted,
  is_family: false,
  featured: false,
  featured_until: null,
  featured_cross_country: false,
  review_status: "approved",
});

// Strip the boost-only fields — they're handled by the post flow, not stored
// on the item itself.
const itemDataFrom = (data) => {
  const { boost_hours, boost_cross_country, boost_amount, claim_free_boost, ...itemData } = data;
  return itemData;
};

export default function Sell() {
  const { user, lang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [popupPay, setPopupPay] = useState(null);
  // Tracks the id of a draft created this session (by Save-draft or the
  // exit-time auto-save) so a later Post publishes that same record instead
  // of creating a duplicate.
  const draftIdRef = useRef(null);

  // Create or update the seller's draft. Used by both the explicit
  // Save-as-draft button (awaited, with toast + navigation) and the
  // exit-time auto-save (fire-and-forget).
  const persistDraft = useCallback(async (data) => {
    const payload = { ...itemDataFrom(data), ...sellerFields(user), status: "draft" };
    if (draftIdRef.current) {
      await base44.entities.Item.update(draftIdRef.current, payload);
      return draftIdRef.current;
    }
    const created = await base44.entities.Item.create(payload);
    draftIdRef.current = created.id;
    return created.id;
  }, [user]);

  const submit = async (data) => {
    const { boost_hours, boost_amount, claim_free_boost } = data;
    const boosted = boost_hours > 0;
    // If a draft was saved this session, publish it in place instead of
    // creating a second record.
    let item;
    if (draftIdRef.current) {
      await base44.entities.Item.update(draftIdRef.current, {
        ...itemDataFrom(data),
        ...sellerFields(user),
        status: "available",
      });
      item = { id: draftIdRef.current };
    } else {
      item = await base44.entities.Item.create({
        ...itemDataFrom(data),
        ...sellerFields(user),
        status: "available",
      });
    }
    base44Analytics.listingPosted(item.id, data.category);
    if (claim_free_boost) {
      try {
        await base44.functions.invoke("claimFreeBoost", { item_id: item.id });
        toast({ title: ar ? "تم نشر إعلانك وتفعيل التعزيز المجاني" : "Listing posted — free boost activated", description: ar ? "تعزيز مجاني ليوم واحد" : "1-day free boost is live" });
      } catch (e) {
        toast({ title: ar ? "تم نشر إعلانك" : "Listing posted", description: ar ? "تعذّر تفعيل التعزيز المجاني" : "Couldn't activate the free boost", variant: "destructive" });
      }
    } else if (boosted) {
      try {
        const res = await base44.functions.invoke("createBoostRequest", {
          item_id: item.id,
          hours: boost_hours,
          origin: window.location.origin,
        });
        if (res?.data?.url) {
          toast({ title: ar ? "تم نشر إعلانك — أكمل الدفع للتعزيز" : "Listing posted — complete payment to boost" });
          setPopupPay({
            url: res.data.url,
            invoiceId: res.data.invoiceId,
            boostRequestId: res.data.request?.id,
            amount: boost_amount,
            itemId: item.id,
          });
          base44Analytics.boostPurchased(item.id, boost_hours);
          return;
        }
      } catch {}
      toast({ title: ar ? "تم نشر إعلانك" : "Listing posted", description: ar ? "تعذّر إنشاء رابط التعزيز" : "Couldn't create boost link", variant: "destructive" });
    }
    nav("/");
  };

  const onSaveDraft = useCallback(async (data) => {
    try {
      await persistDraft(data);
      toast({ title: t("draftSaved") });
      nav("/profile?tab=drafts");
    } catch (e) {
      toast({ title: ar ? "تعذّر حفظ المسودة" : "Couldn't save draft", variant: "destructive" });
      throw e;
    }
  }, [persistDraft, toast, t, ar, nav]);

  // Exit-time auto-save: fire-and-forget. No toast (the user is leaving) and
  // no navigation — the next time they open their profile the draft is there.
  const onAutoSaveDraft = useCallback((data) => {
    persistDraft(data).catch(() => {});
  }, [persistDraft]);

  return (
    <div className="pt-3 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-5">{t("sell")}</h1>
      <ListingForm
        initial={null}
        submitLabel={t("postListing")}
        submittingLabel={t("posting")}
        onSubmit={submit}
        onSaveDraft={onSaveDraft}
        onAutoSaveDraft={onAutoSaveDraft}
      />
      {popupPay && (
        <BoostPopupPayment
          open
          url={popupPay.url}
          invoiceId={popupPay.invoiceId}
          boostRequestId={popupPay.boostRequestId}
          amount={popupPay.amount}
          onDone={(paid) => { setPopupPay(null); nav(`/item/${popupPay.itemId}`); }}
          onClose={() => { setPopupPay(null); nav(`/item/${popupPay.itemId}`); }}
        />
      )}
    </div>
  );
}