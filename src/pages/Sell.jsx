import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import ListingForm from "@/components/ListingForm";

export default function Sell() {
  const { user } = useStore();
  const t = useT();
  const nav = useNavigate();

  const submit = async (data) => {
    await base44.entities.Item.create({
      ...data,
      seller_id: user?.id,
      seller_name: user?.name,
      seller_avatar: user?.avatar || null,
      is_family: false,
      status: "available",
    });
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