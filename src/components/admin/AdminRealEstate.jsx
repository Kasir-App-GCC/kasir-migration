import React, { useEffect, useState } from "react";
import { Building2, Check, X, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import Price from "@/components/Price";

export default function AdminRealEstate() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Item.filter(
        { category: "realestate", review_status: "pending" },
        "-created_date",
        100
      );
      setItems(list || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (item) => {
    try {
      await base44.entities.Item.update(item.id, { review_status: "approved", review_reason: "" });
      await base44.entities.Notification.create({
        user_id: item.seller_id,
        type: "listing_approved",
        text: ar ? `تم اعتماد إعلانك العقاري "${item.title}"` : `Your real estate listing "${item.title}" was approved`,
        item_id: item.id,
        item_title: item.title,
      });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast({ title: ar ? "تم الاعتماد" : "Approved" });
    } catch {
      toast({ title: ar ? "تعذّر الاعتماد" : "Failed to approve", variant: "destructive" });
    }
  };

  const reject = async (item) => {
    if (!reason.trim()) return;
    try {
      await base44.entities.Item.update(item.id, { review_status: "rejected", review_reason: reason.trim() });
      await base44.entities.Notification.create({
        user_id: item.seller_id,
        type: "listing_rejected",
        text: ar ? `تم رفض إعلانك العقاري "${item.title}": ${reason.trim()}` : `Your real estate listing "${item.title}" was rejected: ${reason.trim()}`,
        item_id: item.id,
        item_title: item.title,
      });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setRejecting(null);
      setReason("");
      toast({ title: ar ? "تم الرفض" : "Rejected" });
    } catch {
      toast({ title: ar ? "تعذّر الرفض" : "Failed to reject", variant: "destructive" });
    }
  };

  const licenseTypeLabel = (t) => {
    const map = {
      individual_fal: ar ? "رخصة فال (فرد)" : "FAL (Individual)",
      establishment_fal: ar ? "رخصة فال (منشأة)" : "FAL (Establishment)",
      ad_license: ar ? "ترخيص إعلان عقاري" : "Ad License",
    };
    return map[t] || t || "-";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-indigo-500" />
        <h2 className="font-bold">{ar ? "مراجعة الإعلانات العقارية" : "Real Estate Review"}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{ar ? "الإعلانات العقارية تتطلب ترخيصاً من الهيئة العامة للعقار (REGA) حسب نظام الوساطة العقارية" : "Real estate listings require a REGA license under the Real Estate Brokerage Law"}</p>
      {loading ? (
        <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-10">{ar ? "لا توجد إعلانات عقارية قيد المراجعة" : "No pending real estate listings"}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.images?.[0] ? <Image src={item.images[0]} fittingType="fill" className="w-full h-full" /> : <Building2 size={24} className="m-auto text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.city} · <Price value={item.price} lang={lang} country={item.country || "SA"} /></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ar ? "البائع" : "Seller"}: {item.seller_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">{ar ? "نوع الترخيص" : "License type"}</p>
                  <p className="font-semibold">{licenseTypeLabel(item.re_license_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{ar ? "رقم الترخيص" : "License number"}</p>
                  <p className="font-semibold font-mono">{item.re_license_number || "-"}</p>
                </div>
              </div>
              {item.re_license_doc && (
                <a href={item.re_license_doc} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary font-semibold">
                  <ExternalLink size={14} /> {ar ? "عرض مستند الترخيص" : "View license document"}
                </a>
              )}
              {rejecting === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={ar ? "سبب الرفض" : "Rejection reason"}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-rose-500/30 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => reject(item)} disabled={!reason.trim()} className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">{ar ? "تأكيد الرفض" : "Confirm reject"}</button>
                    <button onClick={() => { setRejecting(null); setReason(""); }} className="px-3 py-2 rounded-xl bg-muted text-sm font-semibold">{ar ? "إلغاء" : "Cancel"}</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => approve(item)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
                    <Check size={15} /> {ar ? "اعتماد" : "Approve"}
                  </button>
                  <button onClick={() => setRejecting(item.id)} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-1.5">
                    <X size={15} /> {ar ? "رفض" : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}