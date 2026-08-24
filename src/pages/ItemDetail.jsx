import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Flag, MessageCircle, Star, Share2, ChevronRight, X, Tag, Trash2, CheckCircle, Pencil, BadgeCheck, RotateCcw, Sparkles, Truck, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice, timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import ItemCard from "@/components/ItemCard";
import { getCategory, getCityName, getCondition } from "@/lib/constants";
import { localizeListingTag } from "@/lib/listingTags";
import { getCountry } from "@/lib/countries";
import RatingStars from "@/components/RatingStars";
import ReviewTagChips from "@/components/ReviewTagChips";
import ReportDialog from "@/components/ReportDialog";
import FullscreenImageViewer from "@/components/FullscreenImageViewer";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Image } from "@/components/ui/image";
import { sendPush } from "@/lib/notify";
import { useBlockStatus } from "@/lib/useBlockStatus";
import { useToast } from "@/components/ui/use-toast";

export default function ItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang } = useStore();
  const t = useT();
  const { toast } = useToast();
  const [item, setItem] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [myScore, setMyScore] = useState(5);
  const [myReview, setMyReview] = useState("");
  const [sellerTags, setSellerTags] = useState([]);
  const [buyerTags, setBuyerTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerOpen, setOfferOpen] = useState(false);
  const [customOffer, setCustomOffer] = useState("");
  const [sending, setSending] = useState(false);
  const [soldOpen, setSoldOpen] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [manualBuyer, setManualBuyer] = useState("");
  const [rateBuyerOpen, setRateBuyerOpen] = useState(false);
  const [buyerScore, setBuyerScore] = useState(5);
  const [buyerReview, setBuyerReview] = useState("");
  const [zoom, setZoom] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [pinchScale, setPinchScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const { blockedByMe, blockedMe } = useBlockStatus(item?.seller_id, user?.id);
  const [canHover] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  const pointers = useRef(new Map());
  const pinchStart = useRef(null);
  const swipeStart = useRef(null);
  const panStart = useRef(null);
  const [pinching, setPinching] = useState(false);
  const pinchScaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const applyZoom = (ns, np) => { pinchScaleRef.current = ns; panRef.current = np; setPinchScale(ns); setPan(np); };
  const resetZoom = () => { pinchScaleRef.current = 1; panRef.current = { x: 0, y: 0 }; setPinchScale(1); setPan({ x: 0, y: 0 }); };

  const clampPan = (x, y, s, w, h) => {
    if (s <= 1) return { x: 0, y: 0 };
    const maxX = ((s - 1) * w) / 2;
    const maxY = ((s - 1) * h) / 2;
    return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
  };

  useEffect(() => { resetZoom(); }, [activeImg]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const it = await base44.entities.Item.get(id);
        setItem(it);
        // Fetch ratings, seller profile, and similar items in parallel for faster load
        const [ratingsRes, profileRes, simRes] = await Promise.allSettled([
          it?.seller_id ? base44.entities.Rating.filter({ rated_user_id: it.seller_id }, "-created_date", 20) : Promise.resolve(null),
          it?.seller_id ? base44.functions.invoke("getPublicProfile", { user_id: it.seller_id }) : Promise.resolve(null),
          it?.category ? base44.entities.Item.filter({ category: it.category, country: it.country, status: "available" }, "-created_date", 7) : Promise.resolve(null),
        ]);
        if (ratingsRes.status === "fulfilled") setRatings(ratingsRes.value || []);
        if (profileRes.status === "fulfilled") setSellerProfile(profileRes.value?.data || null);
        if (simRes.status === "fulfilled") setSimilar((simRes.value || []).filter((x) => x.id !== id).slice(0, 6));
        // Don't count the owner's own views (prevents sellers from inflating their own view count).
        if (it.seller_id !== user?.id) base44.entities.Item.update(id, { views: (Number(it.views) || 0) + 1 }).catch(() => {});
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const seller = item ? { id: item.seller_id, name: item.seller_name, rating: ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : "5.0" } : null;
  const cat = item ? getCategory(item.category) : null;

  const getOrCreateRoom = async (offerPrice) => {
    const existing = await base44.entities.ChatRoom.filter(
      { item_id: item.id, buyer_id: user.id, seller_id: item.seller_id },
      "-created_date",
      5
    );
    if (existing && existing.length) return existing[0];
    return await base44.entities.ChatRoom.create({
      item_id: item.id,
      item_title: item.title,
      item_image: item.images?.[0],
      item_price: offerPrice ?? item.price,
      item_country: item.country,
      seller_id: item.seller_id,
      seller_name: item.seller_name,
      seller_avatar: item.seller_avatar || null,
      buyer_id: user.id,
      buyer_name: user.name,
      buyer_avatar: user?.avatar || null,
      hidden_for_seller: true,
      last_message: "",
    });
  };

  const goLogin = () => nav("/login?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search));
  const messageSeller = async () => {
    if (!item) return;
    if (!user) { goLogin(); return; }
    if (item.seller_id === user.id) { nav("/chats"); return; }
    if (item.status === "sold" || blockedByMe || blockedMe) { setOfferOpen(false); return; }
    const room = await getOrCreateRoom();
    nav(`/chat/${room.id}`);
  };

  const isOwner = user && item && item.seller_id === user.id;

  const sendOffer = async (pct) => {
    if (!item) return;
    if (!user) { setOfferOpen(false); goLogin(); return; }
    if (item.status === "sold" || blockedByMe || blockedMe) { setOfferOpen(false); return; }
    // Lock further offers once an offer for this item is already accepted.
    const alreadyAccepted = await base44.entities.Offer.filter(
      { item_id: item.id, buyer_id: user.id, status: { $in: ["accepted", "completed"] } },
      "-created_date",
      1
    );
    if (alreadyAccepted && alreadyAccepted.length) {
      nav(`/chat/${alreadyAccepted[0].chatroom_id}`);
      return;
    }
    const offerPrice = Math.round(item.price * (1 - pct / 100));
    setSending(true);
    try {
      const room = await getOrCreateRoom(offerPrice);
      await base44.entities.Offer.create({
        chatroom_id: room.id,
        item_id: item.id,
        item_title: item.title,
        buyer_id: user.id,
        buyer_name: user.name,
        seller_id: item.seller_id,
        seller_name: item.seller_name,
        amount: offerPrice,
        status: "pending",
        direction: "buyer_offer",
      });
      const text = (lang === "ar" ? "أبي أعرض عليك بسعر " : "I'd like to offer ") + formatPrice(offerPrice, lang, item.country);
      await base44.entities.ChatRoom.update(room.id, { last_message: text, hidden_for_buyer: false, hidden_for_seller: false });
      base44.entities.Notification.create({
        user_id: item.seller_id,
        type: "offer_received",
        text,
        item_id: item.id,
        item_title: item.title,
        item_image: item.images?.[0] || null,
        chatroom_id: room.id,
        offer_amount: offerPrice,
        actor_name: user.name,
      }).catch(() => {});
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

  const shareItem = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.title, url });
      } catch (err) {
        if (err?.name !== "AbortError") toast({ title: lang === "ar" ? "تعذّر المشاركة" : "Couldn't share", variant: "destructive" });
      }
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: lang === "ar" ? "تم نسخ الرابط" : "Link copied" });
      } catch {
        toast({ title: lang === "ar" ? "تعذّر النسخ" : "Couldn't copy", variant: "destructive" });
      }
    } else {
      toast({ title: lang === "ar" ? "المتصفح لا يدعم المشاركة" : "Sharing not supported", variant: "destructive" });
    }
  };

  const openSold = async () => {
    try {
      const rooms = await base44.entities.ChatRoom.filter({ item_id: item.id }, "-created_date", 50);
      const map = new Map();
      (rooms || []).forEach((r) => {
        if (r.buyer_id && r.buyer_id !== user.id) map.set(r.buyer_id, r.buyer_name);
      });
      setBuyers(Array.from(map, ([id, name]) => ({ id, name })));
    } catch {}
    setSoldOpen(true);
  };

  const markSold = async (buyer) => {
    try {
      await base44.entities.Item.update(item.id, { status: "sold", sold_to: buyer?.id || null, sold_to_name: buyer?.name || null });
      setItem({ ...item, status: "sold", sold_to: buyer?.id || null, sold_to_name: buyer?.name || null });
      if (buyer?.id) {
        try {
          const text = lang === "ar" ? `تم بيع «${item.title}» إليك 🎉` : `"${item.title}" has been sold to you 🎉`;
          await base44.entities.Notification.create({
            user_id: buyer.id,
            type: "sold",
            item_id: item.id,
            item_title: item.title,
            item_image: item.images?.[0] || null,
            text,
          });
        } catch {}
      }
    } catch {}
    setSoldOpen(false);
    setManualBuyer("");
  };

  const unmarkSold = async () => {
    try {
      await base44.entities.Item.update(item.id, { status: "available", sold_to: null, sold_to_name: null });
      setItem({ ...item, status: "available", sold_to: null, sold_to_name: null });
    } catch {}
  };

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground"><div className="w-7 h-7 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }
  if (!item) {
    return <div className="py-20 text-center"><p className="font-semibold">{t("noResults")}</p><button onClick={() => nav("/")} className="mt-3 text-primary font-semibold">{t("back")}</button></div>;
  }

  const imgs = item.images?.length ? item.images : ["https://picsum.photos/seed/" + encodeURIComponent(item.title) + "/800/800"];

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+0.75rem)] max-w-3xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>

      {/* Gallery */}
      <div
        className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-muted ${canHover ? "cursor-zoom-in" : ""}`}
        style={{ touchAction: pinchScale > 1 ? "none" : "pan-y" }}
        onMouseEnter={() => canHover && setZoom(true)}
        onMouseLeave={() => canHover && setZoom(false)}
        onMouseMove={(e) => {
          if (!canHover || pinchScale > 1) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") { swipeStart.current = { x: e.clientX, y: e.clientY }; return; }
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) {
            const [p1, p2] = [...pointers.current.values()];
            const r = e.currentTarget.getBoundingClientRect();
            pinchStart.current = { dist: Math.hypot(p1.x - p2.x, p1.y - p2.y), scale: pinchScaleRef.current, midX: (p1.x + p2.x) / 2 - r.left, midY: (p1.y + p2.y) / 2 - r.top, x: panRef.current.x, y: panRef.current.y };
            setPinching(true);
          } else if (pointers.current.size === 1) {
            setPinching(true);
            if (pinchScaleRef.current > 1.05) panStart.current = { x: e.clientX, y: e.clientY, px: panRef.current.x, py: panRef.current.y };
            else swipeStart.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") return;
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2 && pinchStart.current) {
            const [p1, p2] = [...pointers.current.values()];
            const r = e.currentTarget.getBoundingClientRect();
            const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            let ns = Math.min(Math.max(pinchStart.current.scale * (d / pinchStart.current.dist), 1), 4);
            const mx = (p1.x + p2.x) / 2 - r.left;
            const my = (p1.y + p2.y) / 2 - r.top;
            const cx = r.width / 2, cy = r.height / 2;
            let nx = mx - cx - (mx - cx - pinchStart.current.x) * (ns / pinchStart.current.scale);
            let ny = my - cy - (my - cy - pinchStart.current.y) * (ns / pinchStart.current.scale);
            if (ns <= 1.05) { ns = 1; nx = 0; ny = 0; }
            else { const c = clampPan(nx, ny, ns, r.width, r.height); nx = c.x; ny = c.y; }
            applyZoom(ns, { x: nx, y: ny });
          } else if (pointers.current.size === 1 && panStart.current && pinchScaleRef.current > 1.05) {
            const r = e.currentTarget.getBoundingClientRect();
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            applyZoom(pinchScaleRef.current, clampPan(panStart.current.px + dx, panStart.current.py + dy, pinchScaleRef.current, r.width, r.height));
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") {
            if (!swipeStart.current) return;
            const dx = e.clientX - swipeStart.current.x;
            const dy = e.clientY - swipeStart.current.y;
            swipeStart.current = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
              if (dx < 0) setActiveImg((i) => Math.min(i + 1, imgs.length - 1));
              else setActiveImg((i) => Math.max(i - 1, 0));
            } else {
              setViewerOpen(true);
            }
            return;
          }
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2) pinchStart.current = null;
          if (pointers.current.size === 1) {
            const [p] = [...pointers.current.values()];
            if (pinchScaleRef.current > 1.05) panStart.current = { x: p.x, y: p.y, px: panRef.current.x, py: panRef.current.y };
            else { panStart.current = null; swipeStart.current = { x: p.x, y: p.y }; }
            return;
          }
          if (pointers.current.size === 0) {
            setPinching(false);
            panStart.current = null;
            const start = swipeStart.current;
            swipeStart.current = null;
            if (pinchScaleRef.current <= 1.05) {
              if (start) {
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                  if (dx < 0) setActiveImg((i) => Math.min(i + 1, imgs.length - 1));
                  else setActiveImg((i) => Math.max(i - 1, 0));
                } else {
                  setViewerOpen(true);
                }
              }
              resetZoom();
            }
          }
        }}
        onPointerCancel={() => { pointers.current.clear(); pinchStart.current = null; swipeStart.current = null; panStart.current = null; setPinching(false); resetZoom(); }}
      >
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            transform: pinchScale > 1 ? `translate(${pan.x}px, ${pan.y}px) scale(${pinchScale})` : zoom ? "scale(2.2)" : "scale(1)",
            transformOrigin: pinchScale > 1 ? "center center" : `${origin.x}% ${origin.y}%`,
            transition: pinching ? "none" : "transform 0.25s ease-out",
          }}
        >
          <Image src={imgs[activeImg]} fittingType="fill" className="w-full h-full object-cover" style={{ display: "block" }} />
        </div>
        {item.is_family && (
          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">{t("featuredBadge")}</span>
        )}
        <div className="absolute top-3 end-3 flex gap-2" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          <button onClick={shareItem} className="w-9 h-9 rounded-full bg-white/85 dark:bg-slate-900/55 backdrop-blur flex items-center justify-center" title={t("share") || "Share"}><Share2 size={16} /></button>
          <button onClick={() => (user ? setReportOpen(true) : goLogin())} className="w-9 h-9 rounded-full bg-white/85 dark:bg-slate-900/55 backdrop-blur flex items-center justify-center" title={t("report")}><Flag size={16} /></button>
        </div>
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
              <Image src={u} fittingType="fill" className="w-full h-full object-cover" style={{ display: "block" }} />
            </button>
          ))}
        </div>
      )}

      {/* Title + price */}
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold leading-tight">{item.title}</h1>
          <div className="bg-amber-300 text-slate-900 px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap rotate-[-3deg] shadow">
            <Price value={item.price} lang={lang} country={item.country} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin size={14} /> {item.location_name || getCityName(item.city, lang)} <span className="text-base leading-none">{getCountry(item.country).flag}</span></span>
          <span>· {lang === "ar" ? getCondition(item.condition).ar : getCondition(item.condition).en}</span>
          <span>· {lang === "ar" ? cat?.ar : cat?.en}</span>
          <span>· {timeAgo(item.created_date, lang)}</span>
        </div>
        {(item.willing_to_ship || item.delivers_within_city) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.willing_to_ship && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Truck size={13} /> {t("willingToShip")}{item.shipping_fee ? ` · ${formatPrice(item.shipping_fee, lang, item.country)}` : ""}
              </span>
            )}
            {item.delivers_within_city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                <MapPin size={13} /> {t("deliversWithinCity")}
              </span>
            )}
          </div>
        )}
        {(blockedByMe || blockedMe) && !isOwner && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-sm font-bold">
            <Ban size={15} /> {blockedByMe ? t("blockedUserMsg") : t("blockedByThem")}
          </div>
        )}
        {item.status === "sold" && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-sm font-bold">
            <CheckCircle size={15} /> {t("sold")}
          </div>
        )}
      </div>

      {isOwner && item.featured && item.featured_until && new Date(item.featured_until) > new Date() && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <Sparkles size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {lang === "ar" ? "إعلانك مُعزَّز حتى " : "Your listing is promoted until "}
            {new Date(item.featured_until).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="mt-4">
          <h3 className="font-bold mb-1.5">{t("description")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
        </div>
      )}
      {item.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tg) => (
            <span key={tg} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {localizeListingTag(tg, lang)}
            </span>
          ))}
        </div>
      )}

      {/* Seller card */}
      {seller && (
        <div className="mt-5 rounded-2xl bg-card border border-border/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("theSeller")}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => item.seller_id && nav(`/user/${item.seller_id}`)}
              className="flex items-center gap-3 flex-1 min-w-0 text-start hover:opacity-80 transition"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                {seller.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate flex items-center gap-1">
                  {seller.name}
                  {sellerProfile?.is_trusted && <BadgeCheck size={15} className="text-sky-500 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />}
                  <ChevronRight size={15} className="text-muted-foreground rtl:rotate-180 shrink-0" />
                </p>
                {sellerProfile?.username && <p className="text-xs text-muted-foreground -mt-0.5 truncate">@{sellerProfile.username}</p>}
                <div className="flex items-center gap-1.5 text-sm">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{seller.rating}</span>
                  <span className="text-muted-foreground text-xs">· {ratings.length} {t("ratings")}</span>
                </div>
              </div>
            </button>
            {sellerProfile?.whatsapp_enabled && sellerProfile?.whatsapp_number && !blockedByMe && !blockedMe && (() => {
              const priceLine = formatPrice(item.price, lang, item.country);
              const msg = lang === "ar"
                ? `مرحباً، أنا مهتم بسلعتك: ${item.title} بسعر ${priceLine}`
                : `Hi, I'm interested in your item: ${item.title} for ${priceLine}`;
              return (
                <a
                  href={`https://wa.me/${sellerProfile.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shrink-0 transition"
                  title={lang === "ar" ? "تواصل عبر واتساب" : "Contact on WhatsApp"}
                >
                  <WhatsAppIcon size={18} />
                </a>
              );
            })()}
            <button onClick={() => (user ? setReportOpen(true) : goLogin())} className="p-2 rounded-full hover:bg-muted text-muted-foreground shrink-0" title={t("report")}>
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
                  {r.seller_reply && (
                    <div className="mt-1 ps-2 border-s-2 border-primary/30">
                      <p className="text-[10px] font-bold text-primary">{lang === "ar" ? "رد البائع" : "Seller reply"}</p>
                      <p className="text-xs text-muted-foreground">{r.seller_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="fixed inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/60" style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {isOwner ? (
            <>
              {item.status !== "sold" ? (
                <button onClick={openSold} className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> {t("markAsSold")}
                </button>
              ) : (
                <button onClick={unmarkSold} className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2">
                  <RotateCcw size={18} /> {t("markAsAvailable")}
                </button>
              )}
              <button onClick={() => nav(`/edit/${item.id}`)} className="px-4 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                <Pencil size={18} />
              </button>
              <button onClick={deleteListing} className="px-4 py-3.5 rounded-2xl bg-rose-600 text-white font-bold flex items-center justify-center gap-2">
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t("price")}</p>
                <p className="font-extrabold text-lg"><Price value={item.price} lang={lang} country={item.country} /></p>
              </div>
              <button onClick={() => setOfferOpen(true)} disabled={item.status === "sold" || blockedByMe || blockedMe} className="px-4 py-3.5 rounded-2xl border-2 border-primary text-primary font-bold flex items-center justify-center gap-2 disabled:opacity-40">
                <Tag size={18} /> {t("makeOffer")}
              </button>
              <button onClick={messageSeller} disabled={item.status === "sold" || blockedByMe || blockedMe} className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40">
                <MessageCircle size={18} /> {t("startChat")}
              </button>
            </>
          )}
        </div>
      </div>

      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-[calc(64px+env(safe-area-inset-bottom))]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOfferOpen(false)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{t("makeOffer")}</h3>
              <button onClick={() => setOfferOpen(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("offerDesc")}</p>
            <button
              onClick={() => sendOffer(0)}
              disabled={sending}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={16} /> {t("buyAtOriginal")} <Price value={item.price} lang={lang} country={item.country} />
            </button>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => sendOffer(pct)}
                  disabled={sending}
                  className="py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm leading-tight disabled:opacity-50"
                >
                  {t("haggleBtn")} {pct}%
                  <span className="block text-xs font-semibold opacity-90 mt-0.5"><Price value={Math.round(item.price * (1 - pct / 100))} lang={lang} country={item.country} /></span>
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

      {soldOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-[calc(64px+env(safe-area-inset-bottom))]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSoldOpen(false)} />
          <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{t("markAsSold")}</h3>
              <button onClick={() => setSoldOpen(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            {buyers.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground mb-3">{t("chooseBuyer")}</p>
                <div className="space-y-2">
                  {buyers.map((b) => (
                    <button key={b.id} onClick={() => markSold(b)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:bg-muted transition text-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{b.name?.[0] || "?"}</div>
                      <span className="font-semibold text-sm">{b.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground">{lang === "ar" ? "أو" : "or"}</span>
                  <div className="h-px bg-border flex-1" />
                </div>
              </>
            )}
            {buyers.length === 0 && (
              <p className="text-sm text-muted-foreground mb-3">{lang === "ar" ? "أدخل اسم المشتري (اختياري)" : "Enter buyer name (optional)"}</p>
            )}
            <div className="flex gap-2">
              <input
                value={manualBuyer}
                onChange={(e) => setManualBuyer(e.target.value)}
                placeholder={lang === "ar" ? "اسم المشتري (اختياري)" : "Buyer name (optional)"}
                className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none text-sm"
              />
              <button
                onClick={() => markSold({ id: null, name: manualBuyer.trim() })}
                className="px-5 rounded-2xl bg-emerald-600 text-white font-bold text-sm whitespace-nowrap"
              >
                {t("markAsSold")}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewerOpen && (
        <FullscreenImageViewer images={imgs} index={activeImg} onClose={() => setViewerOpen(false)} lang={lang} />
      )}

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} seller={seller} item={item} />

      {similar.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-3">{t("similarItems")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {similar.map((it) => <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />)}
          </div>
        </div>
      )}
      <div className="h-20" />
    </div>
  );
}