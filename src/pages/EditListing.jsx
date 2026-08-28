import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import ListingForm from "@/components/ListingForm";
import BoostPopupPayment from "@/components/BoostPopupPayment";
import { openCheckoutBlank, closeCheckoutPopup } from "@/hooks/usePopupPayment";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang } = useStore();
  const t = useT();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [item, setItem] = useState(undefined);
  const [error, setError] = useState(null);
  const [popupPay, setPopupPay] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const it = await base44.entities.Item.get(id);
        if (!it || it.seller_id !== user?.id) {
          setError(t("notAllowedEdit"));
        } else {
          setItem(it);
        }
      } catch {
        setError(t("noResults"));
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div className="pt-6 max-w-2xl mx-auto text-center">
        <p className="font-semibold text-muted-foreground">{error}</p>
        <button onClick={() => nav("/profile")} className="mt-3 text-primary font-semibold">{t("back")}</button>
      </div>
    );
  }
  if (item === undefined) {
    return <div className="py-10 text-center text-muted-foreground"><div className="w-7 h-7 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }
  if (item === null) {
    return <div className="py-20 text-center"><p className="font-semibold">{t("noResults")}</p></div>;
  }

  const submit = async (data) => {
    // Strip boost + featured fields: editing must never reset an active boost.
    // The featured clock started at posting time and survives any number of edits.
    const { boost_hours, boost_cross_country, boost_amount, featured, featured_until, featured_cross_country, ...itemData } = data;
    // Open the checkout popup synchronously during the click so the browser
    // doesn't block it (window.open after an async gap loses user activation).
    if (boost_hours > 0) openCheckoutBlank();
    const oldPrice = Number(item?.price);
    // While a boost is active, only allow lowering (or keeping) the price —
    // raising it would devalue the paid promotion.
    const promotedNow = !!(item?.featured && item?.featured_until && new Date(item.featured_until) > new Date());
    if (promotedNow && Number.isFinite(oldPrice) && Number(itemData.price) > oldPrice) {
      toast({ title: ar ? "لا يمكن رفع السعر أثناء الترويج" : "Can't raise the price while promoted", variant: "destructive" });
      throw new Error("price_increase_blocked");
    }
    // Saudi real estate listings are auto-approved when the seller has an
    // approved license (enforced by the listing form). Clear any legacy
    // rejected/pending status on edit so the listing goes live immediately.
    if (itemData.category === "realestate" && itemData.country === "SA" && item?.review_status !== "approved") {
      itemData.review_status = "approved";
      itemData.review_reason = "";
    }
    // Auto-unarchive on save when the blocking reason is resolved (stale, or
    // ad-license expiry updated to a future date). Broker-license blocks can't
    // be cleared here — the seller must renew their license first.
    if (item?.archived) {
      const newIsSaRe = itemData.category === "realestate" && itemData.country === "SA";
      const newBrokerLicensed = !newIsSaRe || user?.re_license_status === "approved";
      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
      const newAdExpired = newIsSaRe && itemData.re_ad_license_expiry && new Date(itemData.re_ad_license_expiry) < t0;
      if (!newIsSaRe || (newBrokerLicensed && !newAdExpired)) {
        itemData.archived = false;
      }
    }
    // Publishing a draft: flip it live. (Save-as-draft keeps status="draft".)
    if (item?.status === "draft") {
      itemData.status = "available";
      itemData.published_date = new Date().toISOString();
    }
    try {
      await base44.entities.Item.update(id, itemData);
    } catch (e) {
      if (boost_hours > 0) closeCheckoutPopup();
      throw e;
    }
    // Price-drop alert: notify users who saved this listing when the price drops.
    if (Number.isFinite(oldPrice) && Number(itemData.price) > 0 && Number(itemData.price) < oldPrice) {
      try { await base44.functions.invoke("notifyPriceDrop", { item_id: id, old_price: oldPrice, new_price: Number(itemData.price) }); } catch {}
    }
    // A boost requested from the edit screen creates a Moyasar invoice; the
    // boost auto-activates on payment (webhook + redirect confirmation) —
    // same as the new-listing flow.
    if (data.claim_free_boost) {
      try {
        await base44.functions.invoke("claimFreeBoost", { item_id: id });
        toast({ title: ar ? "تم حفظ التعديلات وتفعيل التعزيز المجاني" : "Changes saved — free boost activated", description: ar ? "تعزيز مجاني ليوم واحد" : "1-day free boost is live" });
      } catch (e) {
        toast({ title: ar ? "تم حفظ التعديلات" : "Changes saved", description: ar ? "تعذّر تفعيل التعزيز المجاني" : "Couldn't activate the free boost", variant: "destructive" });
      }
    } else if (boost_hours > 0) {
      try {
        const res = await base44.functions.invoke("createBoostRequest", {
          item_id: id,
          hours: boost_hours,
          origin: window.location.origin,
        });
        if (res?.data?.url) {
          toast({ title: ar ? "تم حفظ التعديلات — أكمل الدفع للتعزيز" : "Changes saved — complete payment to boost" });
          setPopupPay({
            url: res.data.url,
            invoiceId: res.data.invoiceId,
            boostRequestId: res.data.request?.id,
            amount: boost_amount,
            itemId: id,
          });
          return;
        }
      } catch {}
      closeCheckoutPopup();
      toast({ title: ar ? "تم حفظ التعديلات" : "Changes saved", description: ar ? "تعذّر إنشاء رابط التعزيز" : "Couldn't create boost link", variant: "destructive" });
    }
    nav(`/item/${id}`);
  };

  const promoted = !!(item?.featured && item?.featured_until && new Date(item.featured_until) > new Date());

  // The `archived` flag is a boolean — the reason isn't stored on the item, so
  // derive it from the listing + the seller's current license status to show
  // the seller why it's down and how to bring it back.
  const archived = !!item?.archived;
  const isSaRe = item?.category === "realestate" && item?.country === "SA";
  const brokerLicensed = !isSaRe || user?.re_license_status === "approved";
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const adLicenseExpired = isSaRe && item?.re_ad_license_expiry && new Date(item.re_ad_license_expiry) < today0;
  let archiveReason = null;
  if (archived) {
    if (isSaRe && !brokerLicensed) {
      archiveReason = {
        key: "broker_license",
        title: ar ? "إعلانك العقاري مؤرشف — ترخيص الوساطة غير نشط" : "Listing archived — broker license inactive",
        desc: ar ? "انتهت أو أُلغيت صلاحية ترخيصك العقاري. جدّده من ملفك الشخصي ليُعاد نشر إعلاناتك تلقائياً." : "Your real estate broker license expired or was revoked. Renew it from your profile to republish your listings.",
        action: { label: ar ? "تجديد الترخيص" : "Renew license", to: "/profile" },
      };
    } else if (isSaRe && adLicenseExpired) {
      archiveReason = {
        key: "ad_license",
        title: ar ? "إعلانك العقاري مؤرشف — انتهت صلاحية ترخيص الإعلان" : "Listing archived — ad license expired",
        desc: ar
          ? `انتهت صلاحية ترخيص الإعلان لهذا العقار بتاريخ ${new Date(item.re_ad_license_expiry).toLocaleDateString("ar-SA")}. حدّث تاريخ انتهاء ترخيص الإعلان في النموذج ثم احفظ — سيُعاد نشر الإعلان تلقائياً.`
          : `This listing's ad license expired on ${new Date(item.re_ad_license_expiry).toLocaleDateString("en-US")}. Update the ad license expiry in the form below and save — the listing will be republished automatically.`,
      };
    } else {
      archiveReason = {
        key: "stale",
        title: ar ? "إعلانك مؤرشف — قديم" : "Listing archived — inactive",
        desc: ar ? "لم يتم تحديث الإعلان منذ أكثر من 30 يوماً. اضغط \"إعادة النشر\" لإعادته للعرض." : "This listing hasn't been refreshed in over 30 days. Tap \"Restore\" to republish it.",
      };
    }
  }

  // Save-as-draft (only used when editing an existing draft): persist the
  // current form data but keep the listing private (status="draft").
  const saveDraft = async (data) => {
    const { boost_hours, boost_cross_country, boost_amount, featured, featured_until, featured_cross_country, claim_free_boost, ...itemData } = data;
    try {
      await base44.entities.Item.update(id, { ...itemData, status: "draft" });
      toast({ title: t("draftSaved") });
      nav("/profile?tab=drafts");
    } catch (e) {
      toast({ title: ar ? "تعذّر حفظ المسودة" : "Couldn't save draft", variant: "destructive" });
      throw e;
    }
  };

  const restoreListing = async () => {
    try {
      await base44.entities.Item.update(id, { archived: false });
      toast({ title: ar ? "تمت إعادة نشر الإعلان" : "Listing restored" });
      nav(`/item/${id}`);
    } catch {
      toast({ title: ar ? "تعذّر التحديث" : "Couldn't restore", variant: "destructive" });
    }
  };

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+0.75rem)] max-w-2xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>
      <h1 className="text-2xl font-extrabold mb-5">{t("editListing")}</h1>
      {archiveReason && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{archiveReason.title}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">{archiveReason.desc}</p>
            </div>
          </div>
          {archiveReason.key === "stale" && (
            <button onClick={restoreListing} className="w-full py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
              <RefreshCw size={15} /> {ar ? "إعادة النشر" : "Restore listing"}
            </button>
          )}
          {archiveReason.action && (
            <button onClick={() => nav(archiveReason.action.to)} className="w-full py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
              {archiveReason.action.label} <ArrowRight size={15} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      )}
      <ListingForm
        initial={item}
        submitLabel={item?.status === "draft" ? t("publish") : t("saveChanges")}
        submittingLabel={item?.status === "draft" ? t("posting") : t("savingChanges")}
        onSubmit={submit}
        onSaveDraft={item?.status === "draft" ? saveDraft : undefined}
        boostLocked={promoted}
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