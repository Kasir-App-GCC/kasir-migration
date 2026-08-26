import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import ListingForm from "@/components/ListingForm";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang } = useStore();
  const t = useT();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [item, setItem] = useState(undefined);
  const [error, setError] = useState(null);

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
    await base44.entities.Item.update(id, itemData);
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
          const win = window.open(res.data.url, "_blank");
          if (!win) window.location.href = res.data.url;
          return;
        }
      } catch {}
      toast({ title: ar ? "تم حفظ التعديلات" : "Changes saved", description: ar ? "تعذّر إنشاء رابط التعزيز" : "Couldn't create boost link", variant: "destructive" });
    }
    nav(`/item/${id}`);
  };

  const promoted = !!(item?.featured && item?.featured_until && new Date(item.featured_until) > new Date());

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+0.75rem)] max-w-2xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>
      <h1 className="text-2xl font-extrabold mb-5">{t("editListing")}</h1>
      <ListingForm
        initial={item}
        submitLabel={t("saveChanges")}
        submittingLabel={t("savingChanges")}
        onSubmit={submit}
        boostLocked={promoted}
      />
    </div>
  );
}