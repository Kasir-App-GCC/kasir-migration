import React, { useState } from "react";
import { X, Save, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { getCities } from "@/lib/countries";
import CurrencySymbol from "@/components/CurrencySymbol";

// Convert Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits to ASCII 0-9
function normalizeDigits(s) {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    const n = code - 0x0660 < 10 ? code - 0x0660 : code - 0x06f0;
    return String(n);
  });
}

// Admin-side listing editor. Unlike the seller's EditListing, the admin can
// override every field — including the price — even while the listing is
// actively promoted (sellers are locked out of price edits during a boost).
export default function AdminEditListing({ item, onClose, onSaved }) {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [title, setTitle] = useState(item.title || "");
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");
  const [category, setCategory] = useState(item.category || "");
  const [condition, setCondition] = useState(item.condition || "good");
  const [city, setCity] = useState(item.city || "");
  const [description, setDescription] = useState(item.description || "");
  const [status, setStatus] = useState(item.status || "available");
  const [saving, setSaving] = useState(false);

  const isPromoted = !!item.featured && item.featured_until && new Date(item.featured_until) > new Date();
  const cities = getCities(item.country || country || "SA");

  const save = async () => {
    if (!title || !price) {
      toast({ title: ar ? "العنوان والسعر مطلوبان" : "Title and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updates = {
        title: title.slice(0, 50),
        price: Number(price),
        category,
        condition,
        city,
        description,
        status,
      };
      await base44.entities.Item.update(item.id, updates);
      toast({ title: ar ? "تم حفظ التعديلات" : "Changes saved" });
      onSaved({ ...item, ...updates });
    } catch {
      toast({ title: ar ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectCls = "w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{ar ? "تعديل الإعلان" : "Edit listing"}</h3>
          <button onClick={() => !saving && onClose()} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold">{ar ? "العنوان" : "Title"} <span className="text-rose-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 50))} maxLength={50} className={selectCls} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">{ar ? "السعر" : "Price"} <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted">
              <input value={price} onChange={(e) => setPrice(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 8))} inputMode="numeric" className="bg-transparent outline-none flex-1" />
              <CurrencySymbol country={item.country || country || "SA"} lang={lang} size={15} className="text-muted-foreground shrink-0" />
            </div>
            {isPromoted && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Lock size={11} /> {ar ? "الإعلان مُعزَّز حالياً — للإدارة صلاحية تعديل السعر" : "Listing is promoted — admin can override the price"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold">{ar ? "القسم" : "Category"}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">{ar ? "الحالة" : "Condition"}</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className={selectCls}>
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold">{ar ? "المدينة" : "City"}</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                {cities.map((c) => (
                  <option key={c.en} value={c.en}>{ar ? c.ar : c.en}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">{ar ? "الحالة" : "Status"}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="available">{ar ? "متاح" : "Available"}</option>
                <option value="sold">{ar ? "مباع" : "Sold"}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">{ar ? "الوصف" : "Description"}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} maxLength={500} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={() => !saving && onClose()} className="flex-1 py-3 rounded-2xl bg-muted font-bold">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={save} disabled={saving || !title || !price} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {saving ? "…" : (ar ? "حفظ" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}