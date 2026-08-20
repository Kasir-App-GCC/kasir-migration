import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Plus, X, MapPin, Clock, Tag, MessageCircle, Trash2, CheckCircle2, LocateFixed } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORIES } from "@/lib/constants";
import { getCities, nearestCityInCountry } from "@/lib/countries";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import CurrencySymbol from "@/components/CurrencySymbol";
import PullToRefresh from "@/components/PullToRefresh";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import CitySearchSelect from "@/components/CitySearchSelect";
import MapPinPicker from "@/components/MapPinPicker";

export default function BuyRequests() {
  const { user, lang, country } = useStore();
  const { toast } = useToast();
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("browse");
  const [form, setForm] = useState({ title: "", category: "", budget: "", city: "", description: "", whatsapp_enabled: false, whatsapp_number: "" });
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [showMap, setShowMap] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.BuyRequest.filter({ country, status: "open" }, "-created_date", 100);
      setRequests(list || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => { load(); }, [load]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = nearestCityInCountry(pos.coords.latitude, pos.coords.longitude, country);
        if (city) {
          setForm((prev) => ({ ...prev, city: city.en }));
          setLocationLabel(lang === "ar" ? city.ar : city.en);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPick = (p) => {
    const city = nearestCityInCountry(p.lat, p.lng, country);
    if (city) {
      setForm((prev) => ({ ...prev, city: city.en }));
      setLocationLabel(lang === "ar" ? city.ar : city.en);
    }
    setShowMap(false);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.city) {
      toast({ title: lang === "ar" ? "أكمل الحقول المطلوبة" : "Please fill required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.BuyRequest.create({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || "other",
        budget: form.budget ? Number(form.budget) : undefined,
        city: form.city,
        country,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar,
        whatsapp_enabled: form.whatsapp_enabled,
        whatsapp_number: form.whatsapp_enabled ? form.whatsapp_number.trim() : "",
        status: "open",
      });
      setForm({ title: "", category: "", budget: "", city: "", description: "", whatsapp_enabled: false, whatsapp_number: "" });
      setShowForm(false);
      toast({ title: lang === "ar" ? "تم نشر طلبك" : "Request posted!" });
      load();
    } catch {
      toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const startChat = async (req) => {
    if (req.user_id === user.id) {
      toast({ title: lang === "ar" ? "هذا طلبك" : "This is your own request" });
      return;
    }
    try {
      const existing = await base44.entities.ChatRoom.filter({
        item_id: req.id,
        seller_id: user.id,
        buyer_id: req.user_id,
      });
      if (existing.length > 0) {
        nav(`/chat/${existing[0].id}`);
        return;
      }
      const room = await base44.entities.ChatRoom.create({
        item_id: req.id,
        item_title: req.title,
        item_price: req.budget || 0,
        seller_id: user.id,
        seller_name: user.name,
        seller_avatar: user.avatar,
        buyer_id: req.user_id,
        buyer_name: req.user_name,
        buyer_avatar: req.user_avatar,
        hidden_for_buyer: true,
      });
      nav(`/chat/${room.id}`);
    } catch {
      toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  const closeRequest = async (id) => {
    try {
      await base44.entities.BuyRequest.update(id, { status: "closed" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast({ title: lang === "ar" ? "تم إغلاق الطلب" : "Request closed" });
    } catch {}
  };

  const deleteRequest = async (id) => {
    try {
      await base44.entities.BuyRequest.delete(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast({ title: lang === "ar" ? "تم الحذف" : "Deleted" });
    } catch {}
  };

  const myRequests = requests.filter((r) => r.user_id === user.id);
  const browseRequests = requests.filter((r) => {
    if (r.user_id === user.id) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterCity && r.city !== filterCity) return false;
    return true;
  });
  const cities = getCities(country);

  return (
    <PullToRefresh onRefresh={load}>
      <div className="pt-2 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl flex items-center gap-2">
            <Megaphone size={22} className="text-violet-500" />
            {lang === "ar" ? "طلبات الشراء" : "Buy Requests"}
          </h1>
          <button
            onClick={() => {
              setForm((prev) => ({ ...prev, whatsapp_enabled: !!user.whatsapp_enabled, whatsapp_number: user.whatsapp_number ? (user.whatsapp_number.startsWith("+") ? user.whatsapp_number : "+" + user.whatsapp_number) : "" }));
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{lang === "ar" ? "أضف طلب" : "New Request"}</span>
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? "أوصف اللي تدوره وحط ميزانيتك، والناس يوصلونك بعروضهم"
            : "Post what you're looking for with your budget, and sellers will come to you with offers."}
        </p>

        <div className="flex gap-1 p-1 bg-muted rounded-xl text-sm">
          <button
            onClick={() => setTab("browse")}
            className={`flex-1 px-3 py-1.5 rounded-lg font-semibold transition ${tab === "browse" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {lang === "ar" ? "تصفح" : "Browse"} ({browseRequests.length})
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 px-3 py-1.5 rounded-lg font-semibold transition ${tab === "mine" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {lang === "ar" ? "طلباتي" : "My Requests"} ({myRequests.length})
          </button>
        </div>

        {tab === "browse" && !loading && requests.length > 0 && (
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-muted outline-none text-sm font-medium"
            >
              <option value="">{lang === "ar" ? "كل الأقسام" : "All categories"}</option>
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
              ))}
            </select>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-muted outline-none text-sm font-medium"
            >
              <option value="">{lang === "ar" ? "كل المدن" : "All cities"}</option>
              {cities.map((c) => (
                <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (tab === "browse" ? browseRequests : myRequests).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Megaphone size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">
              {tab === "browse"
                ? (lang === "ar" ? "لا توجد طلبات شراء" : "No buy requests yet")
                : (lang === "ar" ? "ما عندك طلبات" : "You haven't posted any requests")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(tab === "browse" ? browseRequests : myRequests).map((req) => {
              const cat = CATEGORIES.find((c) => c.id === req.category);
              return (
                <div key={req.id} className="rounded-2xl bg-card border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm leading-snug">{req.title}</h3>
                    {req.budget != null && (
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-violet-500 text-white text-xs font-bold">
                        <Price value={req.budget} lang={lang} country={req.country} />
                      </span>
                    )}
                  </div>
                  {req.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{req.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {cat && (
                      <span className="inline-flex items-center gap-1">
                        <Tag size={12} />
                        {lang === "ar" ? cat.ar : cat.en}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {req.city || (lang === "ar" ? "كل المدن" : "Any city")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {timeAgo(req.created_date, lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                    <button
                      onClick={() => nav(`/user/${req.user_id}`)}
                      className="text-xs font-semibold hover:underline"
                    >
                      {req.user_name?.split(" ")[0]}
                    </button>
                    {tab === "browse" ? (
                      <div className="flex gap-2">
                        {req.whatsapp_enabled && req.whatsapp_number && (
                          <a
                            href={`https://wa.me/${req.whatsapp_number.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            title={lang === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
                          >
                            <WhatsAppIcon size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => startChat(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition"
                        >
                          <MessageCircle size={14} />
                          {lang === "ar" ? "تواصل" : "Chat"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => closeRequest(req.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted text-xs font-semibold hover:bg-muted/70 transition"
                        >
                          <CheckCircle2 size={13} />
                          {lang === "ar" ? "إغلاق" : "Close"}
                        </button>
                        <button
                          onClick={() => deleteRequest(req.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-200 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{lang === "ar" ? "طلب شراء جديد" : "New Buy Request"}</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                    {lang === "ar" ? "ما الذي تبحث عنه؟" : "What are you looking for?"} *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={lang === "ar" ? "مثال: بلايستيشن 5" : "e.g., PlayStation 5"}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                    {lang === "ar" ? "تفاصيل إضافية" : "Details (optional)"}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={lang === "ar" ? "أي تفاصيل إضافية..." : "Any additional details..."}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">{lang === "ar" ? "القسم" : "Category"}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none"
                  >
                    <option value="">{lang === "ar" ? "اختر القسم" : "Select category"}</option>
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                    {lang === "ar" ? "الميزانية" : "Budget (optional)"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value.replace(/[^0-9.]/g, "") })}
                      placeholder={lang === "ar" ? "مثال: 2000" : "e.g., 2000"}
                      className="w-full ps-3 pe-8 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground font-semibold pointer-events-none flex items-center">
                      <CurrencySymbol country={country} lang={lang} size={14} />
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                    {lang === "ar" ? "المدينة" : "City"} *
                  </label>
                  <div className="flex gap-1.5 mb-1.5">
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-sm font-semibold hover:bg-violet-200 dark:hover:bg-violet-900/40 transition disabled:opacity-50"
                    >
                      <LocateFixed size={15} />
                      {locating ? "..." : (lang === "ar" ? "موقعي" : "My location")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/70 transition"
                    >
                      <MapPin size={15} />
                      {lang === "ar" ? "الخريطة" : "Map"}
                    </button>
                  </div>
                  <CitySearchSelect
                    value={form.city}
                    onChange={(city) => { setForm((prev) => ({ ...prev, city })); setLocationLabel(""); }}
                    cities={cities}
                    lang={lang}
                    placeholder={lang === "ar" ? "ابحث عن مدينة..." : "Search city..."}
                  />
                  {locationLabel && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <MapPin size={12} />
                      {locationLabel}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                    {lang === "ar" ? "التواصل عبر واتساب" : "Reach me via WhatsApp"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, whatsapp_enabled: !prev.whatsapp_enabled }))}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${form.whatsapp_enabled ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800" : "bg-muted border border-border/60"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <WhatsAppIcon size={16} className={form.whatsapp_enabled ? "text-emerald-600" : "text-muted-foreground"} />
                      {form.whatsapp_enabled ? (lang === "ar" ? "مفعّل" : "Enabled") : (lang === "ar" ? "غير مفعّل" : "Disabled")}
                    </span>
                    <span className={`w-10 h-6 rounded-full transition relative ${form.whatsapp_enabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.whatsapp_enabled ? "start-[18px]" : "start-0.5"}`} />
                    </span>
                  </button>
                  {form.whatsapp_enabled && (
                    <div className="mt-2">
                      <input
                        type="tel"
                        value={form.whatsapp_number}
                        onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                        placeholder="+966 5X XXX XXXX"
                        className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === "ar" ? "تأكد من الرقم — سيظهر للباعة للتواصل معك مباشرة" : "Make sure the number is correct — sellers will see it to reach you directly"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full mt-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 hover:bg-violet-600 transition"
              >
                {submitting ? (lang === "ar" ? "جاري النشر..." : "Posting...") : (lang === "ar" ? "نشر الطلب" : "Post Request")}
              </button>
            </div>
          </div>
        )}

        {showMap && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMap(false)} />
            <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{lang === "ar" ? "اختر الموقع على الخريطة" : "Pick location on map"}</h3>
                <button onClick={() => setShowMap(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
              </div>
              <MapPinPicker
                center={cities[0] ? { lat: cities[0].lat, lng: cities[0].lng } : { lat: 24.7136, lng: 46.6753 }}
                radius={0}
                onPick={handleMapPick}
              />
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}