import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import ListingForm from "@/components/ListingForm";

export default function Sell() {
  const { user, lang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const { toast } = useToast();
  const ar = lang === "ar";

  const submit = async (data) => {
    const { boost_hours, boost_cross_country, boost_amount, ...itemData } = data;
    await base44.entities.Item.create({
      ...itemData,
      seller_id: user?.id,
      seller_name: user?.name,
      seller_avatar: user?.avatar || null,
      is_family: false,
      status: "available",
    });
    if (boost_hours > 0) {
      toast({
        title: ar ? "تم نشر إعلانك" : "Listing posted",
        description: ar ? "تعزيز مدفوع قريباً — لم يُطبّق التعزيز بعد." : "Paid boost coming soon — boost not applied yet.",
      });
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
    </div>
  );
}