import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Trash2, Pencil, Megaphone, X, RefreshCw, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORIES, getSubcategories } from "@/lib/constants";
import Price from "@/components/Price";

const STATUS_OPTIONS = [
  { id: "all", label_ar: "الكل", label_en: "All" },
  { id: "open", label_ar: "مفتوح", label_en: "Open" },
  { id: "fulfilled", label_ar: "مكتمل", label_en: "Fulfilled" },
  { id: "closed", label_ar: "مغلق", label_en: "Closed" },
];

export default function AdminBuyRequests() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const PAGE_SIZE = 30;
  const [items, setItems] = useState([]);
  const [searchItems, setSearchItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [editItem, setEditItem] = useState(null);
  const skipRef = useRef(0);
  const searchSkipRef = useRef(0);

  const buildSearchQuery = useCallback(() => {
    const query = {};
    const s = q.trim();
    if (s) {
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
        { user_name: { $regex: s, $options: "i" } },
      ];
    }
    if (filter !== "all") query.status = filter;
    return query;
  }, [q, filter]);

  const loadInitial = async () => {
    const list = await base44.entities.BuyRequest.filter({}, "-created_date", PAGE_SIZE, 0);
    setItems(list || []);
    skipRef.current = PAGE_SIZE;
    setHasMore((list || []).length === PAGE_SIZE);
  };

  const reload = async () => {
    try { await loadInitial(); } catch {}
  };

  const loadMore = async () => {
    if (loadingMore) return;
    if (q.trim() || filter !== "all") {
      if (!searchHasMore) return;
      setLoadingMore(true);
      const skip = searchSkipRef.current + PAGE_SIZE;
      try {
        const list = await base44.entities.BuyRequest.filter(buildSearchQuery(), "-created_date", PAGE_SIZE, skip);
        const arr = list || [];
        searchSkipRef.current = skip;
        setSearchItems((prev) => [...(prev || []), ...arr.filter((x) => !(prev || []).some((p) => p.id === x.id))]);
        setSearchHasMore(arr.length === PAGE_SIZE);
      } catch { setSearchHasMore(false); }
      finally { setLoadingMore(false); }
      return;
    }
    if (!hasMore) return;
    setLoadingMore(true);
    try {
      const list = await base44.entities.BuyRequest.filter({}, "-created_date", PAGE_SIZE, skipRef.current);
      const arr = list || [];
      setItems((prev) => [...prev, ...arr.filter((x) => !prev.some((p) => p.id === x.id))]);
      skipRef.current += PAGE_SIZE;
      setHasMore(arr.length === PAGE_SIZE);
    } catch { setHasMore(false); }
    finally { setLoadingMore(false); }
  };

  useEffect(() => {
    if (!q.trim() && filter === "all") { setSearchItems(null); setSearching(false); return; }
    setSearching(true);
    searchSkipRef.current = 0;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const list = await base44.entities.BuyRequest.filter(buildSearchQuery(), "-created_date", PAGE_SIZE, 0);
        if (!alive) return;
        setSearchItems(list || []);
        setSearchHasMore((list || []).length === PAGE_SIZE);
      } catch { if (alive) setSearchItems([]); }
      finally { if (alive) setSearching(false); }
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [buildSearchQuery]);

  useEffect(() => {
    loadInitial().finally(() => setLoading(false));
    const patch = (prev, it, type) => {
      if (!prev) return prev;
      if (type === "delete") return prev.filter((x) => x.id !== it?.id);
      const idx = prev.findIndex((x) => x.id === it.id);
      if (idx === -1) return type === "create" ? [it, ...prev] : prev;
      const copy = [...prev]; copy[idx] = it; return copy;
    };
    const unsub = base44.entities.BuyRequest.subscribe((event) => {
      if (!event) return;
      const it = event.data;
      setItems((prev) => patch(prev, it, event.type));
      setSearchItems((prev) => (prev === null ? prev : patch(prev, it, event.type)));
    });
    return () => unsub?.();
  }, []);

  const filtered = useMemo(() => {
    if (q.trim() || filter !== "all") return searchItems || [];
    return items;
  }, [items, searchItems, q, filter]);

  const deleteReq = async (req) => {
    if (!window.confirm(ar ? `حذف "${req.title}"؟` : `Delete "${req.title}"?`)) return;
    try {
      await base44.entities.BuyRequest.delete(req.id);
      setItems((prev) => prev.filter((x) => x.id !== req.id));
      toast({ title: ar ? "تم الحذف" : "Deleted" });
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
            placeholder={ar ? "بحث بالعنوان أو الوصف أو المستخدم…" : "Search title, description or user…"}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl text-sm">
          {STATUS_OPTIONS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg font-semibold transition ${filter === f.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {ar ? f.label_ar : f.label_en}
            </button>
          ))}
        </div>
        <button onClick={reload} title={ar ? "تحديث" : "Refresh"} className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-sm font-semibold shrink-0"><RefreshCw size={16} /></button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">{searching ? (ar ? "جارٍ البحث…" : "Searching…") : (ar ? "لا توجد طلبات" : "No buy requests")}</div>
        ) : filtered.map((req) => {
          const cat = CATEGORIES.find((c) => c.id === req.category);
          return (
            <div key={req.id} className="rounded-2xl bg-card border border-border/60 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
                <Megaphone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{req.title}</span>
                  {req.budget != null && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-violet-500 text-white text-[10px] font-bold">
                      <Price value={req.budget} lang={lang} country={req.country} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {req.user_name || "—"} · {cat ? (ar ? cat.ar : cat.en) : req.category || "—"} · {req.city || "—"}
                </p>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  req.status === "open" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : req.status === "fulfilled" ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {STATUS_OPTIONS.find((s) => s.id === req.status)?.[ar ? "label_ar" : "label_en"] || req.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setEditItem(req)} title={ar ? "تعديل" : "Edit"} className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"><Pencil size={16} /></button>
                <button onClick={() => deleteReq(req)} title={ar ? "حذف" : "Delete"} className="w-8 h-8 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-center transition"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {(q.trim() || filter !== "all")
        ? searchHasMore && (searchItems?.length || 0) > 0 ? (
            <div className="flex justify-center py-4">
              <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                {loadingMore ? "…" : (ar ? "عرض المزيد" : "See more")}
              </button>
            </div>
          ) : null
        : hasMore ? (
            <div className="flex justify-center py-4">
              <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                {loadingMore ? "…" : (ar ? "عرض المزيد" : "See more")}
              </button>
            </div>
          ) : null}

      {editItem && (
        <EditBuyRequestDialog
          req={editItem}
          lang={lang}
          onClose={() => setEditItem(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}

function EditBuyRequestDialog({ req, lang, onClose, onSaved }) {
  const ar = lang === "ar";
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: req.title || "",
    description: req.description || "",
    category: req.category || "",
    budget: req.budget != null ? String(req.budget) : "",
    city: req.city || "",
    status: req.status || "open",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.BuyRequest.update(req.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        city: form.city,
        status: form.status,
      });
      toast({ title: ar ? "تم الحفظ" : "Saved" });
      onSaved(updated);
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && onClose?.()} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{ar ? "تعديل طلب الشراء" : "Edit Buy Request"}</h3>
          <button onClick={() => onClose?.()} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{ar ? "العنوان" : "Title"}</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{ar ? "الوصف" : "Description"}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{ar ? "القسم" : "Category"}</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none">
              <option value="">{ar ? "بدون" : "None"}</option>
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{ar ? "الميزانية" : "Budget"}</label>
            <input type="text" inputMode="decimal" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value.replace(/[^0-9.]/g, "") })} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{ar ? "المدينة" : "City"}</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">{ar ? "الحالة" : "Status"}</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none">
              {STATUS_OPTIONS.filter((s) => s.id !== "all").map((s) => (
                <option key={s.id} value={s.id}>{ar ? s.label_ar : s.label_en}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
          {saving ? (ar ? "جاري..." : "Saving...") : (ar ? "حفظ" : "Save")}
        </button>
      </div>
    </div>
  );
}