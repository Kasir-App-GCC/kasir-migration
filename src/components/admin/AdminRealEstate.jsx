import React, { useEffect, useState } from "react";
import { Building2, Check, X, ExternalLink, User as UserIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import Price from "@/components/Price";
import AdminUserPreview from "@/components/admin/AdminUserPreview";
import AdminItemPreview from "@/components/admin/AdminItemPreview";

export default function AdminRealEstate() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);

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
      // Notify the seller first (while the item still exists), then delete
      // the listing entirely so it no longer appears in "My listings" — a
      // rejected real estate ad has no valid license to keep on display.
      await base44.entities.Notification.create({
        user_id: item.seller_id,
        type: "listing_rejected",
        text: ar ? `تم رفض إعلانك العقاري "${item.title}": ${reason.trim()}` : `Your real estate listing "${item.title}" was rejected: ${reason.trim()}`,
        item_id: item.id,
        item_title: item.title,
      });
      await base44.entities.Item.delete(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setRejecting(null);
      setReason("");
      toast({ title: ar ? "تم الرفض وحذف الإعلان" : "Rejected & removed" });
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

  const openItem = (item) => setPreviewItem(item);
  const openUser = (item) => setPreviewUser(item.seller_id);

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
                <button
                  onClick={() => openItem(item)}
                  title={ar ? "فتح الإعلان للمراجعة" : "Open listing to review"}
                  className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 relative group"
                >
                  {item.images?.[0] ? <Image src={item.images[0]} fittingType="fill" className="w-full h-full" /> : <Building2 size={24} className="m-auto text-muted-foreground" />}
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ExternalLink size={16} className="text-white" />
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => openItem(item)} className="font-bold text-sm truncate hover:text-primary hover:underline text-start block w-full" title={ar ? "فتح الإعلان" : "Open listing"}>
                    {item.title}
                  </button>
                  <p className="text-xs text-muted-foreground">{item.city} · <Price value={item.price} lang={lang} country={item.country || "SA"} /></p>
                  <button
                    onClick={() => openUser(item)}
                    className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1 hover:text-primary hover:underline"
                    title={ar ? "عرض تفاصيل البائع" : "View seller details"}
                  >
                    <UserIcon size={11} className="shrink-0" />
                    {ar ? "البائع" : "Seller"}: {item.seller_name}
                  </button>
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
                <div className="col-span-2">
                  <p className="text-muted-foreground">{ar ? "صاحب الترخيص" : "License holder"}</p>
                  <p className="font-semibold">{item.re_license_holder || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{ar ? "تاريخ انتهاء الرخصة" : "License expiry"}</p>
                  <p className={`font-semibold ${item.re_license_expiry && new Date(item.re_license_expiry) < new Date() ? "text-rose-600 dark:text-rose-400" : ""}`}>
                    {item.re_license_expiry ? new Date(item.re_license_expiry).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                    {item.re_license_expiry && new Date(item.re_license_expiry) < new Date() && (ar ? " · منتهية" : " · expired")}
                  </p>
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

      {previewItem && <AdminItemPreview item={previewItem} onClose={() => setPreviewItem(null)} />}
      {previewUser && <AdminUserPreview userId={previewUser} onClose={() => setPreviewUser(null)} />}
    </div>
  );
}