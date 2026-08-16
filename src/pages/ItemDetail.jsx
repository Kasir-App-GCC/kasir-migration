import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Flag, MessageCircle, Star, Share2, ChevronRight, X, Tag, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice, timeAgo } from "@/lib/format";
import { getCategory, getCityName } from "@/lib/constants";
import RatingStars from "@/components/RatingStars";
import ReportDialog from "@/components/ReportDialog";

function pseudoRating(id) {
  if (!id) return 4.8;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (4 + (h % 100) / 100).toFixed(1);
}

export default function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang } = useStore();
  const t = useT();
  const [item, setItem] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [myScore, setMyScore] = useState(5);
  const [myReview, setMyReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [offerOpen, setOfferOpen] = useState(false);
  const [customOffer, setCustomOffer] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const it = await base44.entities.Item.get(id);
        setItem(it);
        if (it?.seller_id) {
          try {
            const rs = await base44.entities.Rating.filter({ rated_user_id: it.seller_id }, "-created_date", 20);
            setRatings(rs || []);
          } catch {}
        }
        base44.entities.Item.update(id, { views: (Number(it.views) || 0) + 1 }).catch(() => {});
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const seller = item ? { id: item.seller_id, name: item.seller_name, rating: ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : pseudoRating(item.seller_id) } : null;
  const cat = item ? getCategory(item.category) : null;

  const messageSeller = async () => {
    if (!user || !item) return;
    if (item.seller_id === user.id) { nav("/chats"); return; }
    const room = await base44.entities.ChatRoom.create({
      item_id: item.id,
      item_title: item.title,
      item_image: item.images?.[0],
      item_price: item.price,
      seller_id: item.seller_id,
      seller_name: item.seller_name,
      buyer_id: user.id,
      buyer_name: user.name,
      last_message: "",
    });
    nav(`/chat/${room.id}`);
  };

  const submitRating = async () => {
    await base44.entities.Rating.create({
      rated_user_id: item.seller_id,
      rated_user_name: item.seller_name,
      rater_user_id: user.id,
      rater_name: user.name,
      score: myScore,
      review: myReview,
      role: "buyer",
    });
    setRateOpen(false);
    const rs = await base44.entities.Rating.filter({ rated_user_id: item.seller_id }, "-created_date", 20);
    setRatings(rs || []);
  };

  const isOwner = user && item && item.seller_id === user.id;

  const sendOffer = async (pct) => {
    if (!user || !item) return;
    const offerPrice = Math.round(item.price * (1 - pct / 100));
    setSending(true);
    try {
      const room = await base44.entities.ChatRoom.create({
        item_id: item.id,
        item_title: item.title,
        item_image: item.images?.[0],
        item_price: offerPrice,
        seller_id: item.seller_id,
        seller_name: item.seller_name,
        buyer_id: user.id,
        buyer_name: user.name,
        last_message: "",
      });
      const text = (lang === "ar" ? "أبي أعرض عليك بسعر " : "I'd like to offer ") + formatPrice(offerPrice, lang);
      await base44.entities.Message.create({ chatroom_id: room.id, sender_id: user.id, sender_name: user.name, text });
      await base44.entities.ChatRoom.update(room.id, { last_message: text });
      nav(`/chat/${room.id}`);
    } catch {
      setSending(false);
    }
  };

  const deleteListing = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try { await base44.entities.Item.delete(item.id); } catch {}
    nav("/profile");
  };

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground"><div className="w-7 h-7 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }
  if (!item) {
    return <div className="py-20 text-center"><p className="font-semibold">{t("noResults")}</p><button onClick={() => nav("/")} className="mt-3 text-primary font-semibold">{t("back")}</button></div>;
  }

  const imgs = item.images?.length ? item.images : ["https://picsum.photos/seed/" + encodeURIComponent(item.title) + "/800/800"];

  return (
    <div className="pt-3 max-w-3xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>

      {/* Gallery */}
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-muted">
        <img src={imgs[activeImg]} className="w-full h-full object-cover" />
        {item.is_family && (
          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">{t("featuredBadge")}</span>
        )}
        <button className="absolute top-3 end-3 w-9 h-9 rounded-full bg-white/85 dark:bg-slate-900/55 backdrop-blur flex items-center justify-center"><Share2 size={16} /></button>
        {imgs.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {imgs.map((_, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`w-2 h-2 rounded-full ${i === activeImg ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {imgs.map((u, i) => (
            <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-2 ${i === activeImg ? "ring-primary" : "ring-transparent"}`}>
              <img src={u} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Title + price */}
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold leading-tight">{item.title}</h1>
          <div className="bg-amber-300 text-slate-900 px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap rotate-[-3deg] shadow">
            {formatPrice(item.price, lang)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin size={14} /> {getCityName(item.city, lang)}</span>
          <span>· {t("condition_" + (item.condition || "used"))}</span>
          <span>· {lang === "ar" ? cat?.ar : cat?.en}</span>
          <span>· {timeAgo(item.created_date, lang)}</span>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div className="mt-4">
          <h3 className="font-bold mb-1.5">{t("description")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
        </div>
      )}

      {/* Seller card */}
      {seller && (
        <div className="mt-5 rounded-2xl bg-card border border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {seller.name?.[0] || "?"}
            </div>
            <div className="flex-1">
              <p className="font-bold">{seller.name}</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold">{seller.rating}</span>
                <span className="text-muted-foreground text-xs">· {ratings.length} {t("ratings")}</span>
              </div>
            </div>
            <button onClick={() => setReportOpen(true)} className="p-2 rounded-full hover:bg-muted text-muted-foreground" title={t("report")}>
              <Flag size={18} />
            </button>
          </div>
          {ratings.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
              {ratings.slice(0, 2).map((r) => (
                <div key={r.id}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{r.rater_name}</span>
                    <RatingStars value={r.score} size={12} />
                  </div>
                  {r.review && <p className="text-xs text-muted-foreground mt-0.5">{r.review}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rate seller (if not owner) */}
      {user && item.seller_id !== user.id && (
        <button onClick={() => setRateOpen(true)} className="mt-3 w-full py-3 rounded-2xl border border-border bg-card text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted/50">
          <Star size={16} className="fill-amber-400 text-amber-400" /> {t("rateSeller")}
        </button>
      )}

      {/* Action bar */}
      <div className="fixed bottom-16 inset-x-0 z-20 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {isOwner ? (
            <button onClick={deleteListing} className="flex-1 py-3.5 rounded-2xl bg-rose-600 text-white font-bold flex items-center justify-center gap-2">
              <Trash2 size={18} /> {t("deleteListing")}
            </button>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t("price")}</p>
                <p className="font-extrabold text-lg">{formatPrice(item.price, lang)}</p>
              </div>
              <button onClick={() => setOfferOpen(true)} className="px-4 py-3.5 rounded-2xl border-2 border-primary text-primary font-bold flex items-center justify-center gap-2">
                <Tag size={18} /> {t("makeOffer")}
              </button>
              <button onClick={messageSeller} className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                <MessageCircle size={18} /> {t("startChat")}
              </button>
            </>
          )}
        </div>
      </div>

      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOfferOpen(false)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{t("makeOffer")}</h3>
              <button onClick={() => setOfferOpen(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("offerDesc")}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => sendOffer(pct)}
                  disabled={sending}
                  className="py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm leading-tight disabled:opacity-50"
                >
                  {pct}% {t("off")}
                  <span className="block text-xs font-semibold opacity-90 mt-0.5">{formatPrice(Math.round(item.price * (1 - pct / 100)), lang)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customOffer}
                onChange={(e) => setCustomOffer(e.target.value.replace(/\D/g, ""))}
                placeholder={t("yourOffer")}
                inputMode="numeric"
                className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none"
              />
              <button
                onClick={() => {
                  const val = Number(customOffer);
                  if (val > 0 && val < item.price) {
                    const pct = Math.round((1 - val / item.price) * 100);
                    sendOffer(pct);
                  }
                }}
                disabled={sending || !customOffer}
                className="px-5 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
              >
                {t("send")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} seller={seller} item={item} />

      {rateOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRateOpen(false)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{t("rateSeller")}</h3>
              <button onClick={() => setRateOpen(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{t("yourRating")}</p>
            <RatingStars value={myScore} size={34} interactive onChange={setMyScore} />
            <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} placeholder={t("reviewPlaceholder")} rows={3} className="mt-4 w-full px-3.5 py-3 rounded-xl bg-muted text-sm outline-none resize-none" />
            <button onClick={submitRating} className="mt-4 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold">{t("submitRating")}</button>
          </div>
        </div>
      )}
      <div className="h-20" />
    </div>
  );
}