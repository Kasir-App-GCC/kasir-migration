import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Plus, X, MapPin, Clock, Tag, MessageCircle, Trash2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORIES } from "@/lib/constants";
import { getCities } from "@/lib/countries";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import PullToRefresh from "@/components/PullToRefresh";

export default function BuyRequests() {
  const { user, lang, country } = useStore();
  const { toast } = useToast();
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("browse");
  const [form, setForm] = useState({ title: "", category: "", budget: "", city: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

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
        status: "open",
      });
      setForm({ title: "", category: "", budget: "", city: "", description: "" });
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
  const browseRequests = requests.filter((r) => r.user_id !== user.id);
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
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{lang === "ar" ? "أضف طلب" : "New Request"}</span>
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? "أوصف اللي تدوره وحط ميزانيتك، والباعة يوصلونك بعروضهم"
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
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold">
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
                      <button
                        onClick={() => startChat(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition"
                      >
                        <MessageCircle size={14} />
                        {lang === "ar" ? "تواصل" : "Chat"}
                      </button>
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
                    {lang === "ar" ? "ماذا تبحث عن؟" : "What are you looking for?"} *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={lang === "ar" ? "مثال: بلايستيشن 5" : "e.g., PlayStation 5"}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
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
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder={lang === "ar" ? "مثال: 2000" : "e.g., 2000"}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                    {lang === "ar" ? "المدينة" : "City"} *
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none"
                  >
                    <option value="">{lang === "ar" ? "اختر المدينة" : "Select city"}</option>
                    {cities.map((c) => (
                      <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
                    ))}
                  </select>
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
      </div>
    </PullToRefresh>
  );
}