import React, { useEffect, useState, useMemo } from "react";
import { Search, Trash2, Eye, Star, Tag, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { getCategory } from "@/lib/constants";
import Price from "@/components/Price";

export default function AdminListings() {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [featureItem, setFeatureItem] = useState(null);
  const [featureHours, setFeatureHours] = useState(24);
  const [featureSaving, setFeatureSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Item.list("-created_date", 1000);
        setItems(list || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let r = items;
    if (filter === "sold") r = r.filter((i) => i.status === "sold");
    else if (filter === "available") r = r.filter((i) => i.status === "available");
    else if (filter === "featured") r = r.filter((i) => i.featured);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((i) => (i.title || "").toLowerCase().includes(s) || (i.seller_name || "").toLowerCase().includes(s));
    }
    return r;
  }, [items, q, filter]);

  const deleteItem = async (it) => {
    if (!window.confirm(ar ? `حذف "${it.title}"؟` : `Delete "${it.title}"?`)) return;
    try {
      await base44.entities.Item.delete(it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      toast({ title: ar ? "تم حذف الإعلان" : "Listing deleted" });
    } catch {
      toast({ title: ar ? "فشل الحذف" : "Delete failed", variant: "destructive" });
    }
  };

  const openFeature = (it) => {
    setFeatureItem(it);
    setFeatureHours(24);
  };

  const applyFeature = async () => {
    if (!featureItem || !featureHours || featureHours < 1) return;
    setFeatureSaving(true);
    try {
      const until = new Date(Date.now() + featureHours * 3600000).toISOString();
      await base44.entities.Item.update(featureItem.id, { featured: true, featured_until: until });
      setItems((prev) => prev.map((x) => (x.id === featureItem.id ? { ...x, featured: true, featured_until: until } : x)));
      toast({ title: ar ? "تم التمييز" : "Featured", description: ar ? `لمدة ${featureHours} ساعة` : `For ${featureHours} hours` });
      setFeatureItem(null);
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setFeatureSaving(false);
    }
  };

  const defeature = async () => {
    if (!featureItem) return;
    setFeatureSaving(true);
    try {
      await base44.entities.Item.update(featureItem.id, { featured: false, featured_until: null });
      setItems((prev) => prev.map((x) => (x.id === featureItem.id ? { ...x, featured: false, featured_until: null } : x)));
      toast({ title: ar ? "تم إزالة التمييز" : "Unfeatured" });
      setFeatureItem(null);
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setFeatureSaving(false);
    }
  };

  const markSold = async (it) => {
    try {
      await base44.entities.Item.update(it.id, { status: it.status === "sold" ? "available" : "sold" });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: x.status === "sold" ? "available" : "sold" } : x)));
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "بحث بالعنوان أو البائع…" : "Search title or seller…"}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl text-sm">
          {[
            { id: "all", label: ar ? "الكل" : "All" },
            { id: "available", label: ar ? "متاح" : "Available" },
            { id: "sold", label: ar ? "مباع" : "Sold" },
            { id: "featured", label: ar ? "مميز" : "Featured" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg font-semibold transition ${filter === f.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">{ar ? "لا توجد إعلانات" : "No listings found"}</div>
        ) : filtered.map((it) => (
          <div key={it.id} className="rounded-2xl bg-card border border-border/60 p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
              {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tag size={20} className="text-muted-foreground" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">{it.title}</p>
                {it.featured && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                <Price value={it.price} lang={lang} country={it.country} /> · {it.seller_name || "—"} · {getCategory(it.category)?.[ar ? "ar" : "en"] || it.category}
              </p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${it.status === "sold" ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
                {it.status === "sold" ? (ar ? "مباع" : "Sold") : (ar ? "متاح" : "Available")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => nav(`/item/${it.id}`)} title={ar ? "عرض" : "View"} className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"><Eye size={16} /></button>
              <button onClick={() => openFeature(it)} title={ar ? "تمييز" : "Feature"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${it.featured ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40" : "bg-muted hover:bg-muted/70"}`}><Star size={16} className={it.featured ? "fill-amber-500" : ""} /></button>
              <button onClick={() => markSold(it)} title={ar ? "تبديل الحالة" : "Toggle sold"} className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"><Tag size={16} /></button>
              <button onClick={() => deleteItem(it)} title={ar ? "حذف" : "Delete"} className="w-8 h-8 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-center transition"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {featureItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !featureSaving && setFeatureItem(null)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg">{ar ? "تمييز الإعلان" : "Feature listing"}</h3>
              <button onClick={() => !featureSaving && setFeatureItem(null)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-4">{featureItem.title}</p>

            {featureItem.featured && featureItem.featured_until && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  {new Date(featureItem.featured_until) > new Date()
                    ? (ar ? `مميز حالياً حتى ${new Date(featureItem.featured_until).toLocaleString(ar ? "ar-SA" : "en-US")}` : `Currently featured until ${new Date(featureItem.featured_until).toLocaleString()}`)
                    : (ar ? "انتهت مدة التمييز السابقة" : "Previous feature expired")}
                </span>
              </div>
            )}

            <label className="text-sm font-semibold mb-2 block">{ar ? "المدة بالساعات" : "Duration (hours)"}</label>
            <div className="flex gap-2 mb-3">
              {[24, 48, 72].map((h) => (
                <button key={h} type="button" onClick={() => setFeatureHours(h)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${featureHours === h ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{h} {ar ? "س" : "h"}</button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={720}
              value={featureHours}
              onChange={(e) => setFeatureHours(Math.max(1, Math.min(720, Number(e.target.value) || 1)))}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm mb-4"
            />
            <p className="text-[11px] text-muted-foreground mb-4">{ar ? "ساعة الإدارة تتجاوز ساعة المستخدم — يبدأ العد من الآن" : "Admin hours override user hours — clock starts now"}</p>

            <div className="flex gap-2">
              {featureItem.featured && (
                <button onClick={defeature} disabled={featureSaving} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold disabled:opacity-50">
                  {ar ? "إزالة التمييز" : "Defeature"}
                </button>
              )}
              <button onClick={applyFeature} disabled={featureSaving || featureHours < 1} className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-bold disabled:opacity-50">
                {featureSaving ? "…" : (ar ? "تمييز" : "Feature")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}