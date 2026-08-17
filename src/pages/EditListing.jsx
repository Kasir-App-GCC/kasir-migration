import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import ListingForm from "@/components/ListingForm";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useStore();
  const t = useT();
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
    const { boost_hours, boost_cross_country, boost_amount, ...itemData } = data;
    await base44.entities.Item.update(id, itemData);
    nav(`/item/${id}`);
  };

  return (
    <div className="pt-3 max-w-2xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>
      <h1 className="text-2xl font-extrabold mb-5">{t("editListing")}</h1>
      <ListingForm
        initial={item}
        submitLabel={t("saveChanges")}
        submittingLabel={t("savingChanges")}
        onSubmit={submit}
      />
    </div>
  );
}