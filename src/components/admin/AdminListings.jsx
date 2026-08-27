import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Search, Trash2, Pencil, Star, Tag, Clock, X, RefreshCw, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { getCategory } from "@/lib/constants";
import Price from "@/components/Price";
import AdminEditListing from "@/components/admin/AdminEditListing";

const isLiveFeatured = (it) => !!it?.featured && (!it.featured_until || new Date(it.featured_until).getTime() > Date.now());
const isSponsored = (it) => !!it?.admin_sponsored && (!it.admin_sponsored_until || new Date(it.admin_sponsored_until).getTime() > Date.now());

export default function AdminListings() {
  const { lang, country } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const PAGE_SIZE = 24;
  const [items, setItems] = useState([]);
  const [searchItems, setSearchItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [featureItem, setFeatureItem] = useState(null);
  const [featureHours, setFeatureHours] = useState(24);
  const [featureSaving, setFeatureSaving] = useState(false);
  const [sponsorItem, setSponsorItem] = useState(null);
  const [sponsorDays, setSponsorDays] = useState(1);
  const [sponsorSaving, setSponsorSaving] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const skipRef = useRef(0);
  const searchSkipRef = useRef(0);

  const loadInitial = async () => {
    const list = await base44.entities.Item.filter({}, "-created_date", PAGE_SIZE, 0);
    setItems(list || []);
    skipRef.current = PAGE_SIZE;
    setHasMore((list || []).length === PAGE_SIZE);
  };

  const reload = async () => {
    try { await loadInitial(); } catch {}
  };

  const loadMore = async () => {
    if (loadingMore) return;
    // Server-query mode (search, stale, or featured) paginates the server-filtered results.
    if (q.trim() || filter === "stale" || filter === "featured") {
      if (!searchHasMore) return;
      setLoadingMore(true);
      const skip = searchSkipRef.current + PAGE_SIZE;
      try {
        const list = await base44.entities.Item.filter(buildSearchQuery(), "-created_date", PAGE_SIZE, skip);
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
      const list = await base44.entities.Item.filter({}, "-created_date", PAGE_SIZE, skipRef.current);
      const arr = list || [];
      setItems((prev) => [...prev, ...arr.filter((x) => !prev.some((p) => p.id === x.id))]);
      skipRef.current += PAGE_SIZE;
      setHasMore(arr.length === PAGE_SIZE);
    } catch { setHasMore(false); }
    finally { setLoadingMore(false); }
  };

  // Server-side search: query the whole catalog (title / seller) via $regex so
  // any listing is found — not just the ones already loaded into the browse
  // view. The status/featured filter is applied server-side too. Debounced.
  const buildSearchQuery = useCallback(() => {
    const query = {};
    const s = q.trim();
    if (s) {
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { seller_name: { $regex: s, $options: "i" } },
      ];
    }
    if (filter === "available") query.status = "available";
    else if (filter === "sold") query.status = "sold";
    else if (filter === "featured") query.featured = true;
    else if (filter === "stale") {
      // Unsold listings older than 3 months — queried from the server so
      // stale inventory buried deep in pagination is still surfaced.
      query.status = "available";
      query.created_date = { $lt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString() };
    }
    return query;
  }, [q, filter]);

  useEffect(() => {
    // Server-side query path is used for text search AND the "stale" filter
    // (which needs a server date query, not client filtering of loaded pages).
    if (!q.trim() && filter !== "stale" && filter !== "featured") { setSearchItems(null); setSearching(false); return; }
    setSearching(true);
    searchSkipRef.current = 0;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const list = await base44.entities.Item.filter(buildSearchQuery(), "-created_date", PAGE_SIZE, 0);
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
    // Live updates: new/changed/deleted listings appear without a manual refresh.
    const patch = (prev, it, type) => {
      if (!prev) return prev;
      if (type === "delete") return prev.filter((x) => x.id !== it?.id);
      const idx = prev.findIndex((x) => x.id === it.id);
      if (idx === -1) return type === "create" ? [it, ...prev] : prev;
      const copy = [...prev]; copy[idx] = it; return copy;
    };
    const unsub = base44.entities.Item.subscribe((event) => {
      if (!event) return;
      const it = event.data;
      setItems((prev) => patch(prev, it, event.type));
      setSearchItems((prev) => (prev === null ? prev : patch(prev, it, event.type)));
    });
    return () => unsub?.();
  }, []);

  const filtered = useMemo(() => {
    // Server-query mode (text search, stale, or featured filter): results
    // already came from the server filtered by the query — only refine
    // "featured" for liveness (expired boosts still carry featured:true).
    if (q.trim() || filter === "stale" || filter === "featured") {
      let r = searchItems || [];
      if (filter === "featured") r = r.filter((i) => isLiveFeatured(i));
      return r;
    }
    let r = items;
    if (filter === "sold") r = r.filter((i) => i.status === "sold");
    else if (filter === "available") r = r.filter((i) => i.status === "available");
    else if (filter === "featured") r = r.filter((i) => isLiveFeatured(i));
    return r;
  }, [items, searchItems, q, filter]);

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

  const openSponsor = (it) => {
    setSponsorItem(it);
    const remaining = it.admin_sponsored_until ? Math.ceil((new Date(it.admin_sponsored_until) - Date.now()) / 86400000) : 0;
    setSponsorDays(isSponsored(it) && remaining > 0 ? remaining : 1);
  };

  const applySponsor = async () => {
    if (!sponsorItem || !sponsorDays || sponsorDays < 1) return;
    setSponsorSaving(true);
    try {
      const until = new Date(Date.now() + sponsorDays * 86400000).toISOString();
      await base44.entities.Item.update(sponsorItem.id, { admin_sponsored: true, admin_sponsored_until: until });
      setItems((prev) => prev.map((x) => (x.id === sponsorItem.id ? { ...x, admin_sponsored: true, admin_sponsored_until: until } : x)));
      toast({ title: ar ? "تمت الرعاية" : "Sponsored", description: ar ? `لمدة ${sponsorDays} يوم` : `For ${sponsorDays} day(s)` });
      setSponsorItem(null);
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setSponsorSaving(false);
    }
  };

  const desponsor = async () => {
    if (!sponsorItem) return;
    setSponsorSaving(true);
    try {
      await base44.entities.Item.update(sponsorItem.id, { admin_sponsored: false, admin_sponsored_until: null });
      setItems((prev) => prev.map((x) => (x.id === sponsorItem.id ? { ...x, admin_sponsored: false, admin_sponsored_until: null } : x)));
      toast({ title: ar ? "تم إلغاء الرعاية" : "Desponsored" });
      setSponsorItem(null);
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setSponsorSaving(false);
    }
  };

  const markSold = async (it) => {
    const newStatus = it.status === "sold" ? "available" : "sold";
    try {
      await base44.entities.Item.update(it.id, { status: newStatus });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: newStatus } : x)));
      setSearchItems((prev) => (prev ? prev.map((x) => (x.id === it.id ? { ...x, status: newStatus } : x)) : prev));
      toast({ title: newStatus === "sold" ? (ar ? "تم تعليمه كمباع" : "Marked as sold") : (ar ? "تم تعليمه كمتاح" : "Marked as available") });
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
            { id: "stale", label: ar ? "راكد +٣شهر" : "Stale >3mo" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg font-semibold transition ${filter === f.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{f.label}</button>
          ))}
        </div>
        <button onClick={reload} title={ar ? "تحديث" : "Refresh"} className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-sm font-semibold shrink-0"><RefreshCw size={16} /></button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">{searching ? (ar ? "جارٍ البحث…" : "Searching…") : (ar ? "لا توجد إعلانات" : "No listings found")}</div>
        ) : filtered.map((it) => (
          <div key={it.id} className="rounded-2xl bg-card border border-border/60 p-3 flex items-center gap-3">
            <button onClick={() => nav(`/item/${it.id}`)} className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
              {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tag size={20} className="text-muted-foreground" /></div>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <button onClick={() => nav(`/item/${it.id}`)} className="font-semibold text-sm truncate text-start hover:underline">{it.title}</button>
                {isLiveFeatured(it) && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                {isSponsored(it) && <Rocket size={12} className="text-violet-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                <Price value={it.price} lang={lang} country={it.country} /> · {it.seller_name || "—"} · {getCategory(it.category)?.[ar ? "ar" : "en"] || it.category}
              </p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${it.status === "sold" ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
                {it.status === "sold" ? (ar ? "مباع" : "Sold") : (ar ? "متاح" : "Available")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setEditItem(it)} title={ar ? "تعديل" : "Edit"} className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"><Pencil size={16} /></button>
              <button onClick={() => openFeature(it)} title={ar ? "تمييز" : "Feature"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${isLiveFeatured(it) ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40" : "bg-muted hover:bg-muted/70"}`}><Star size={16} className={isLiveFeatured(it) ? "fill-amber-500" : ""} /></button>
              <button onClick={() => openSponsor(it)} title={ar ? "رعاية" : "Sponsor"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${isSponsored(it) ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40" : "bg-muted hover:bg-muted/70"}`}><Rocket size={16} className={isSponsored(it) ? "fill-violet-500" : ""} /></button>
              <button onClick={() => markSold(it)} title={ar ? "تبديل الحالة" : "Toggle sold"} className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"><Tag size={16} /></button>
              <button onClick={() => deleteItem(it)} title={ar ? "حذف" : "Delete"} className="w-8 h-8 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-center transition"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {(q.trim() || filter === "stale" || filter === "featured")
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
        <AdminEditListing
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditItem(null);
          }}
        />
      )}

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

      {sponsorItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !sponsorSaving && setSponsorItem(null)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg flex items-center gap-1.5"><Rocket size={18} className="text-violet-500" /> {ar ? "رعاية الإعلان" : "Sponsor listing"}</h3>
              <button onClick={() => !sponsorSaving && setSponsorItem(null)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-4">{sponsorItem.title}</p>

            {isSponsored(sponsorItem) && sponsorItem.admin_sponsored_until && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
                <Clock size={16} className="text-violet-600 shrink-0" />
                <span className="text-xs text-violet-700 dark:text-violet-300">
                  {new Date(sponsorItem.admin_sponsored_until) > new Date()
                    ? (ar ? `مُمول حالياً حتى ${new Date(sponsorItem.admin_sponsored_until).toLocaleString(ar ? "ar-SA" : "en-US")}` : `Currently sponsored until ${new Date(sponsorItem.admin_sponsored_until).toLocaleString()}`)
                    : (ar ? "انتهت مدة الرعاية السابقة" : "Previous sponsorship expired")}
                </span>
              </div>
            )}

            <label className="text-sm font-semibold mb-2 block">{ar ? "المدة بالأيام" : "Duration (days)"}</label>
            <div className="flex gap-2 mb-3">
              {[1, 3, 7, 14].map((d) => (
                <button key={d} type="button" onClick={() => setSponsorDays(d)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${sponsorDays === d ? "bg-violet-500 text-white" : "bg-muted"}`}>{d} {ar ? "ي" : "d"}</button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={365}
              value={sponsorDays}
              onChange={(e) => setSponsorDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm mb-2"
            />
            <p className="text-[11px] text-muted-foreground mb-4">{ar ? "الإعلان المُمول يظهر أعلى بطاقات الصفحة الرئيسية بغض النظر عن تاريخ النشر، ويعود لترتيبه العادي عند انتهاء المدة." : "Sponsored listings pin to the top of the Home feed regardless of post date, and return to normal order when the period ends."}</p>

            <div className="flex gap-2">
              {isSponsored(sponsorItem) && (
                <button onClick={desponsor} disabled={sponsorSaving} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold disabled:opacity-50">
                  {ar ? "إلغاء الرعاية" : "Desponsor"}
                </button>
              )}
              <button onClick={applySponsor} disabled={sponsorSaving || sponsorDays < 1} className="flex-1 py-3 rounded-2xl bg-violet-500 text-white font-bold disabled:opacity-50">
                {sponsorSaving ? "…" : (ar ? "رعاية" : "Sponsor")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}