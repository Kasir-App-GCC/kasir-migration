import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import ListingForm from "@/components/ListingForm";
import BoostPopupPayment from "@/components/BoostPopupPayment";

export default function Sell() {
  const { user, lang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [popupPay, setPopupPay] = useState(null);

  const submit = async (data) => {
    const { boost_hours, boost_cross_country, boost_amount, ...itemData } = data;
    const boosted = boost_hours > 0;
    const item = await base44.entities.Item.create({
      ...itemData,
      seller_id: user?.id,
      seller_name: user?.name,
      seller_avatar: user?.avatar || null,
      seller_trusted: !!user?.is_trusted,
      is_family: false,
      status: "available",
      featured: false,
      featured_until: null,
      featured_cross_country: false,
      review_status: "approved",
    });
    if (data.claim_free_boost) {
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
          return;
        }
      } catch {}
      toast({ title: ar ? "تم نشر إعلانك" : "Listing posted", description: ar ? "تعذّر إنشاء رابط التعزيز" : "Couldn't create boost link", variant: "destructive" });
    }
    nav("/");
  };

  return (
    <div className="pt-3 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-5">{t("sell")}</h1>
      <ListingForm
        initial={null}
        submitLabel={t("postListing")}
        submittingLabel={t("posting")}
        onSubmit={submit}
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