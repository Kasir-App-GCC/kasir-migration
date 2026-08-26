import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import ListingForm from "@/components/ListingForm";
import MoyasarPaymentDialog from "@/components/MoyasarPaymentDialog";

export default function Sell() {
  const { user, lang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [boostPay, setBoostPay] = useState(null);

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
        });
        if (res?.data?.ok) {
          toast({ title: ar ? "تم نشر إعلانك — أكمل الدفع للتعزيز" : "Listing posted — complete payment to boost" });
          setBoostPay({
            itemId: item.id,
            amount: res.data.amount,
            publishableKey: res.data.publishableKey,
            requestId: res.data.requestId,
            hours: res.data.hours,
          });
          return;
        }
      } catch {}
      toast({ title: ar ? "تم نشر إعلانك" : "Listing posted", description: ar ? "تعذّر بدء الدفع" : "Couldn't start payment", variant: "destructive" });
    }
    nav("/");
  };

  const onPaidBoost = async (payment) => {
    const res = await base44.functions.invoke("confirmBoostPayment", { paymentId: payment.id });
    if (res?.data?.error) throw new Error(res.data.error);
    toast({ title: ar ? "تم تفعيل التعزيز ⭐" : "Boost activated ⭐" });
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
      {boostPay && (
        <MoyasarPaymentDialog
          open
          lang={lang}
          amount={boostPay.amount}
          publishableKey={boostPay.publishableKey}
          callbackUrl={`${window.location.origin}/item/${boostPay.itemId}?boost_payment=1`}
          metadata={{ type: "boost", user_id: String(user.id), boost_request_id: String(boostPay.requestId), item_id: String(boostPay.itemId), hours: String(boostPay.hours) }}
          description={`تعزيز إعلان - كاسر (${boostPay.hours} ساعة)`}
          onPaid={onPaidBoost}
          onClose={() => { const id = boostPay.itemId; setBoostPay(null); nav(`/item/${id}`); }}
        />
      )}
    </div>
  );
}