import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ShieldCheck, Check, CheckCheck, Star, BadgeCheck, Ban, ShieldAlert, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import Price from "@/components/Price";
import OfferCard from "@/components/OfferCard";
import TrustedBadge from "@/components/TrustedBadge";
import PullToRefreshScroll from "@/components/PullToRefreshScroll";
import RatingDialog from "@/components/RatingDialog";
import DisputeDialog from "@/components/DisputeDialog";
import MeetupFlow from "@/components/MeetupFlow";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import WhatsAppContactDialog from "@/components/WhatsAppContactDialog";
import ChatDateSeparator, { shouldShowSeparator } from "@/components/ChatDateSeparator";
import { useBlockStatus } from "@/lib/useBlockStatus";

export default function ChatRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang, country, setLastChatsSeen } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [room, setRoom] = useState(null);
  const [itemCountry, setItemCountry] = useState("SA");
  const [messages, setMessages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherTrusted, setOtherTrusted] = useState(false);
  const [otherAvatar, setOtherAvatar] = useState(null);
  const [ratedOffers, setRatedOffers] = useState(new Set());
  const [ratingOffer, setRatingOffer] = useState(null);
  const [disputeOffer, setDisputeOffer] = useState(null);
  const [acceptedMeetup, setAcceptedMeetup] = useState(null);
  const [waContacts, setWaContacts] = useState([]);
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [chatGone, setChatGone] = useState(false);
  const rateParam = new URLSearchParams(window.location.search).get("rate");
  const endRef = useRef(null);
  const [vvHeight, setVvHeight] = useState(() => window.visualViewport?.height || window.innerHeight);
  const [vvTop, setVvTop] = useState(() => window.visualViewport?.offsetTop || 0);

  // Resize the entire chat container to the visualViewport so the keyboard
  // never covers the input bar — the container shrinks to the visible area
  // and the flex layout keeps the input pinned to the bottom edge. This is
  // the approach used by WhatsApp / Telegram — no manual keyboard insets.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => { setVvHeight(vv.height); setVvTop(vv.offsetTop); };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const loadAll = useCallback(async () => {
    const [ms, ofs, was] = await Promise.all([
      base44.entities.Message.filter({ chatroom_id: id }, "created_date", 200),
      base44.entities.Offer.filter({ chatroom_id: id }, "created_date", 100),
      base44.entities.WhatsAppContact.filter({ chatroom_id: id }, "created_date", 100),
    ]);
    setMessages(ms || []);
    setOffers(ofs || []);
    setWaContacts(was || []);
    if (ofs && ofs.length && user?.id) {
      try {
        const offerIds = ofs.map((o) => o.id);
        const ratings = await base44.entities.Rating.filter({ rater_user_id: user.id, offer_id: { $in: offerIds } }, "-created_date", 100);
        setRatedOffers(new Set((ratings || []).map((r) => r.offer_id)));
      } catch {}
    }
  }, [id, user?.id]);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.ChatRoom.get(id);
        setRoom(r);
        // Resolve the item's country so prices in chat render in the right currency.
        // New rooms carry item_country; old rooms fall back to fetching the item.
        if (r?.item_country) {
          setItemCountry(r.item_country);
        } else if (r?.item_id && r.item_id !== "official") {
          try { const it = await base44.entities.Item.get(r.item_id); if (it?.country) setItemCountry(it.country); } catch {}
        }
        const otherId = r && String(r.seller_id) === String(user?.id) ? r.buyer_id : r?.seller_id;
        if (otherId) {
          try {
            const p = await base44.functions.invoke("getPublicProfile", { user_id: otherId });
            setOtherTrusted(!!p?.data?.is_trusted);
            if (p?.data?.avatar) setOtherAvatar(p.data.avatar);
          } catch {}
        }
        await loadAll();
      } catch {
        // Chat room is gone (hard-deleted or inaccessible). If we arrived from
        // a rate notification carrying an offer_id, load that offer so the
        // standalone RatingDialog can still render over the fallback screen.
        setChatGone(true);
        if (rateParam && user?.id) {
          try {
            const offer = await base44.entities.Offer.get(rateParam);
            if (offer && (String(offer.buyer_id) === String(user.id) || String(offer.seller_id) === String(user.id))) {
              setRatingOffer(offer);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers, vvHeight]);

  useEffect(() => {
    setLastChatsSeen(new Date().toISOString());
    return () => setLastChatsSeen(new Date().toISOString());
  }, []);

  useEffect(() => {
    const upsertMsg = (m) => {
      if (!m || m.chatroom_id !== id) return;
      setMessages((prev) => {
        const i = prev.findIndex((x) => x.id === m.id);
        if (i === -1) return [...prev, m];
        const copy = [...prev]; copy[i] = m; return copy;
      });
    };
    const upsertOffer = (o) => {
      if (!o || o.chatroom_id !== id) return;
      setOffers((prev) => {
        const i = prev.findIndex((x) => x.id === o.id);
        if (i === -1) return [...prev, o];
        const copy = [...prev]; copy[i] = o; return copy;
      });
    };
    const unsubM = base44.entities.Message.subscribe((event) => {
      if (event?.type === "delete") {
        const m = event.data;
        if (m?.chatroom_id === id) setMessages((prev) => prev.filter((x) => x.id !== m.id));
      } else if (event?.data) upsertMsg(event.data);
    });
    const unsubO = base44.entities.Offer.subscribe((event) => {
      if (event?.type === "delete") {
        const o = event.data;
        if (o?.chatroom_id === id) setOffers((prev) => prev.filter((x) => x.id !== o.id));
      } else if (event?.data) upsertOffer(event.data);
    });
    const unsubR = base44.entities.ChatRoom.subscribe((event) => {
      if (event?.data?.id === id) setRoom(event.data);
    });
    const unsubW = base44.entities.WhatsAppContact.subscribe((event) => {
      if (event?.type === "delete") {
        const w = event.data;
        if (w?.chatroom_id === id) setWaContacts((prev) => prev.filter((x) => x.id !== w.id));
      } else if (event?.data?.chatroom_id === id) {
        setWaContacts((prev) => {
          const i = prev.findIndex((x) => x.id === event.data.id);
          if (i === -1) return [...prev, event.data];
          const copy = [...prev]; copy[i] = event.data; return copy;
        });
      }
    });
    return () => { unsubM?.(); unsubO?.(); unsubR?.(); unsubW?.(); };
  }, [id]);

  // Mark this chat as seen by the current user so the other party gets read receipts
  useEffect(() => {
    if (!room || !user) return;
    const field = String(room.seller_id) === String(user.id) ? "seller_last_seen" : "buyer_last_seen";
    const update = () => base44.entities.ChatRoom.update(id, { [field]: new Date().toISOString() }).catch(() => {});
    update();
    return () => { update(); };
  }, [id, room?.id, room?.seller_id, user?.id]);

  const isSeller = !!room && String(room.seller_id) === String(user?.id);
  const isOfficial = !!room?.is_official;
  const officialLabel = room?.official_label || "";
  const otherName = room ? (isSeller ? room.buyer_name : room.seller_name) : "";
  const roomAvatar = room ? (isSeller ? room.buyer_avatar : room.seller_avatar) : null;
  const avatar = otherAvatar || roomAvatar;
  const otherLastSeen = room ? (isSeller ? room.buyer_last_seen : room.seller_last_seen) : null;
  const otherId = room ? (isSeller ? room.buyer_id : room.seller_id) : null;
  const { blockedByMe, blockedMe, block, unblock, reload } = useBlockStatus(otherId, user?.id);
  const isBlocked = blockedByMe || blockedMe;

  // Live-update block status so a freshly-blocked user immediately loses the
  // ability to send messages without needing a manual reload.
  useEffect(() => {
    if (!otherId || !user?.id) return;
    const unsub = base44.entities.UserBlock.subscribe((event) => {
      const d = event?.data;
      if (!d) return;
      if ((d.blocker_id === user.id && d.blocked_id === otherId) || (d.blocker_id === otherId && d.blocked_id === user.id)) {
        reload();
      }
    });
    return unsub;
  }, [otherId, user?.id, reload]);

  const goToProfile = () => {
    if (!otherId || isOfficial) return;
    nav(`/user/${otherId}?name=${encodeURIComponent(otherName || "")}&avatar=${encodeURIComponent(avatar || "")}`);
  };

  const sendText = async (value) => {
    if (isBlocked) return;
    const body = (value ?? text).trim();
    if (!body) return;
    setText("");
    try {
      const res = await base44.functions.invoke("sendMessage", { chatroom_id: id, text: body });
      const msg = res?.data?.message;
      if (msg) setMessages((prev) => {
        const i = prev.findIndex((x) => x.id === msg.id);
        if (i === -1) return [...prev, msg];
        const copy = [...prev]; copy[i] = msg; return copy;
      });
    } catch {}
  };

  const sysMsg = (text, offerId) =>
    base44.entities.Message.create({ chatroom_id: id, sender_id: "system", sender_name: t("adminName"), text, kind: "system", offer_id: offerId || null });

  const acceptOffer = async (offer) => {
    // If accepting a modification request, supersede the currently-accepted
    // offer so the new amount replaces it. The original accepted offer is
    // preserved when a modification request is rejected (see requestModification).
    const prevAccepted = offers.filter((o) => o.id !== offer.id && o.status === "accepted");
    const isModAcceptance = prevAccepted.length > 0;
    if (isModAcceptance) {
      setOffers((prev) => prev.map((o) => (prevAccepted.some((a) => a.id === o.id) ? { ...o, status: "countered" } : o)));
    }
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: "accepted" } : o)));
    const otherId = offer.direction === "buyer_offer" ? offer.buyer_id : offer.seller_id;
    const ntxt = lang === "ar"
      ? `تم قبول عرضك (${formatPrice(offer.amount, lang, itemCountry, country)})`
      : `Your offer was accepted (${formatPrice(offer.amount, lang, itemCountry, country)})`;
    const agreeTxt = lang === "ar"
      ? `تم الاتفاق على السعر ${formatPrice(offer.amount, lang, itemCountry, country)} ✅`
      : `Price agreed at ${formatPrice(offer.amount, lang, itemCountry, country)} ✅`;
    base44.entities.Notification.create({
      user_id: otherId, type: "offer_accepted", text: ntxt,
      item_id: offer.item_id, item_title: offer.item_title, chatroom_id: id,
      offer_amount: offer.amount, actor_name: user.name,
    }).catch(() => {});
    // Only prompt ratings on the first acceptance — a modification acceptance
    // shouldn't re-trigger duplicate rating prompts.
    if (!isModAcceptance) {
      base44.entities.Notification.create({
        user_id: offer.buyer_id, type: "rate", item_id: offer.item_id, item_title: offer.item_title,
        text: lang === "ar" ? "قيّم البائع" : "Rate the seller", actor_name: offer.seller_name, chatroom_id: id,
        reference_id: offer.id,
      }).catch(() => {});
      base44.entities.Notification.create({
        user_id: offer.seller_id, type: "rate", item_id: offer.item_id, item_title: offer.item_title,
        text: lang === "ar" ? "قيّم المشتري" : "Rate the buyer", actor_name: offer.buyer_name, chatroom_id: id,
        reference_id: offer.id,
      }).catch(() => {});
    }
    try { await base44.functions.invoke("manageOffer", { action: "accept", offer_id: offer.id }); } catch {}
    try { await base44.entities.ChatRoom.update(id, { last_message: agreeTxt, hidden_for_buyer: false, hidden_for_seller: false }); } catch {}
  };

  const rejectOffer = async (offer) => {
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: "rejected" } : o)));
    const otherId = offer.direction === "buyer_offer" ? offer.buyer_id : offer.seller_id;
    const ntxt = lang === "ar" ? "تم رفض عرضك" : "Your offer was rejected";
    base44.entities.Notification.create({
      user_id: otherId, type: "offer_rejected", text: ntxt,
      item_id: offer.item_id, item_title: offer.item_title, chatroom_id: id,
      offer_amount: offer.amount, actor_name: user.name,
    }).catch(() => {});
    try { await base44.functions.invoke("manageOffer", { action: "reject", offer_id: offer.id }); } catch {}
    const txt = lang === "ar" ? "تم رفض العرض" : "Offer rejected";
    await base44.entities.ChatRoom.update(id, { last_message: txt, hidden_for_buyer: false, hidden_for_seller: false });
  };

  const notMatchOffer = async (offer) => {
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: "not_match" } : o)));
    const otherId = offer.direction === "buyer_offer" ? offer.buyer_id : offer.seller_id;
    const ntxt = lang === "ar" ? "ليس ما أبحث عنه" : "Not what I'm looking for";
    base44.entities.Notification.create({
      user_id: otherId, type: "offer_rejected", text: ntxt,
      item_id: offer.item_id, item_title: offer.item_title, chatroom_id: id,
      offer_amount: offer.amount, actor_name: user.name,
    }).catch(() => {});
    try { await base44.functions.invoke("manageOffer", { action: "not_match", offer_id: offer.id }); } catch {}
    await base44.entities.ChatRoom.update(id, { last_message: ntxt, hidden_for_buyer: false, hidden_for_seller: false });
  };

  const counterOffer = async (offer, amount) => {
    if (offers.some((o) => o.status === "accepted" || o.status === "completed") && !offer.previous_offer_id) return;
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: "countered" } : o)));
    const otherId = isSeller ? offer.buyer_id : offer.seller_id;
    const ntxt = lang === "ar"
      ? `تمت معارضة عرضك بسعر ${formatPrice(amount, lang, itemCountry, country)}`
      : `Your offer was countered at ${formatPrice(amount, lang, itemCountry, country)}`;
    base44.entities.Notification.create({
      user_id: otherId, type: "offer_countered", text: ntxt,
      item_id: offer.item_id, item_title: offer.item_title, chatroom_id: id,
      offer_amount: amount, actor_name: user.name,
    }).catch(() => {});
    try {
      const res = await base44.functions.invoke("manageOffer", { action: "counter", offer_id: offer.id, amount });
      const created = res?.data?.created;
      if (created) setOffers((prev) => [...prev, created]);
    } catch {}
    const preview = (isSeller
      ? (lang === "ar" ? `عارض البائع بسعر ${formatPrice(amount, lang, itemCountry, country)}` : `Seller counters at ${formatPrice(amount, lang, itemCountry, country)}`)
      : (lang === "ar" ? `عرض جديد بسعر ${formatPrice(amount, lang, itemCountry, country)}` : `New offer at ${formatPrice(amount, lang, itemCountry, country)}`));
    await base44.entities.ChatRoom.update(id, { last_message: preview, hidden_for_buyer: false, hidden_for_seller: false });
  };

  const modifyOffer = async (offer, amount) => {
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, amount } : o)));
    const otherId = offer.direction === "buyer_offer" ? offer.seller_id : offer.buyer_id;
    const ntxt = lang === "ar"
      ? `تم تعديل العرض إلى ${formatPrice(amount, lang, itemCountry, country)}`
      : `Offer updated to ${formatPrice(amount, lang, itemCountry, country)}`;
    base44.entities.Notification.create({
      user_id: otherId, type: "offer_modified", text: ntxt,
      item_id: offer.item_id, item_title: offer.item_title, chatroom_id: id,
      offer_amount: amount, actor_name: user.name,
    }).catch(() => {});
    try { await base44.functions.invoke("manageOffer", { action: "modify", offer_id: offer.id, amount }); } catch {}
    const txt = lang === "ar" ? `تم تعديل العرض إلى ${formatPrice(amount, lang, itemCountry, country)}` : `Offer updated to ${formatPrice(amount, lang, itemCountry, country)}`;
    await base44.entities.ChatRoom.update(id, { last_message: txt, hidden_for_buyer: false, hidden_for_seller: false });
  };

  const confirmReceipt = async (offer) => {
    try { await base44.functions.invoke("manageOffer", { action: "confirm_receipt", offer_id: offer.id }); } catch {}
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: "completed", received_confirmed: true } : o)));
  };

  // Request a modification to an accepted offer WITHOUT ending it: create a
  // fresh pending offer at the new amount. The original accepted offer stays
  // valid — only if the other party accepts the modification does it supersede.
  // Rejecting the modification simply rejects the new pending offer.
  const requestModification = async (offer, amount) => {
    let created;
    try {
      const res = await base44.functions.invoke("manageOffer", { action: "request_modification", offer_id: offer.id, amount });
      created = res?.data?.created;
    } catch { return; }
    if (created) setOffers((prev) => [...prev, created]);
    const otherId = isSeller ? offer.buyer_id : offer.seller_id;
    const ntxt = ar
      ? `طلب تعديل العرض المقبول إلى ${formatPrice(amount, lang, itemCountry, country)}`
      : `Modification requested on accepted offer to ${formatPrice(amount, lang, itemCountry, country)}`;
    base44.entities.Notification.create({
      user_id: otherId, type: "offer_modified", text: ntxt,
      item_id: offer.item_id, item_title: offer.item_title, chatroom_id: id,
      offer_amount: amount, actor_name: user.name,
    }).catch(() => {});
    const preview = ar ? `طلب تعديل العرض إلى ${formatPrice(amount, lang, itemCountry, country)}` : `Modification requested: ${formatPrice(amount, lang, itemCountry, country)}`;
    await base44.entities.ChatRoom.update(id, { last_message: preview, hidden_for_buyer: false, hidden_for_seller: false });
  };

  const timeline = useMemo(
    () => [
      ...messages.filter((m) => m.sender_id !== "system").map((m) => ({ type: "message", ...m })),
      ...offers.map((o) => ({ type: "offer", ...o })),
      ...waContacts.map((w) => ({ type: "whatsapp", ...w })),
    ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
    [messages, offers, waContacts]
  );

  const acceptedOffer = useMemo(
    () =>
      offers
        .filter((o) => o.status === "accepted" || o.status === "completed")
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null,
    [offers]
  );

  // Track the meetup for the accepted offer so the offer card knows to defer
  // rate/dispute/confirm to the meetup flow, and the meetup flow stays in sync.
  useEffect(() => {
    if (!acceptedOffer) { setAcceptedMeetup(null); return; }
    let active = true;
    const reload = async () => {
      try {
        const rows = await base44.entities.Meetup.filter({ offer_id: acceptedOffer.id }, "-created_date", 10);
        if (active) setAcceptedMeetup(rows?.[0] || null);
      } catch { if (active) setAcceptedMeetup(null); }
    };
    reload();
    const unsub = base44.entities.Meetup.subscribe((event) => {
      const d = event?.data;
      if (!d || d.offer_id !== acceptedOffer.id) return;
      reload();
    });
    return () => { active = false; unsub?.(); };
  }, [acceptedOffer?.id]);

  const hasMeetup = !!acceptedMeetup && acceptedMeetup.status !== "cancelled";
  const meetupCompleted = !!acceptedMeetup && acceptedMeetup.status === "completed";
  const bothVerified = !!user?.is_trusted && !!otherTrusted;

  // Fallback: the chat room is gone. Show a minimal screen with the standalone
  // RatingDialog overlaying it (when we have an offer to rate).
  if (chatGone) {
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center px-6 text-center">
        <button onClick={() => nav("/notifications")} className="absolute top-4 start-4 p-2 rounded-full hover:bg-muted">
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </button>
        <MessageCircle size={40} className="text-muted-foreground opacity-40 mb-3" />
        <p className="font-semibold text-lg mb-1">{ar ? "المحادثة غير متاحة" : "Chat unavailable"}</p>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs">
          {ratingOffer
            ? (ar ? "تم حذف المحادثة، لكن يمكنك إكمال تقييمك." : "This chat was deleted, but you can still complete your rating.")
            : (ar ? "لم نتمكن من فتح هذه المحادثة. قد تكون محذوفة." : "We couldn't open this chat. It may have been deleted.")}
        </p>
        {!ratingOffer && (
          <button onClick={() => nav("/notifications")} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            {ar ? "العودة للإشعارات" : "Back to notifications"}
          </button>
        )}
        {ratingOffer && (
          <RatingDialog
            offer={ratingOffer}
            user={user}
            lang={lang}
            onClose={() => { setRatingOffer(null); nav("/notifications"); }}
            onDone={() => { setRatingOffer(null); nav("/notifications"); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 z-40 bg-background flex flex-col" style={{ height: `${vvHeight}px`, top: `${vvTop}px` }}>
      <header className="pt-[env(safe-area-inset-top)] border-b border-border/60 bg-background/90 backdrop-blur shrink-0">
        <div className="h-14 flex items-center gap-3 px-4">
        <button onClick={() => nav("/chats")} className="p-1.5 rounded-full hover:bg-muted"><ArrowLeft size={20} className="rtl:rotate-180" /></button>
        <button
          onClick={goToProfile}
          className="flex-1 flex items-center gap-3 min-w-0 text-start"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {avatar ? <img src={avatar} alt={otherName} className="w-full h-full object-cover" /> : (otherName?.[0] || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate flex items-center gap-1">
              {otherName}
              {otherTrusted && <TrustedBadge size={15} />}
              {isOfficial && !isSeller && !otherTrusted && <BadgeCheck size={15} className="text-primary shrink-0" />}
            </p>
            {isOfficial ? (
              <p className="text-xs text-muted-foreground truncate">{officialLabel} · {ar ? "محادثة رسمية" : "Official chat"}</p>
            ) : room?.item_title ? (
              <p className="text-xs text-muted-foreground truncate">{room.item_title} · <Price value={room.item_price} lang={lang} country={itemCountry} /></p>
            ) : null}
          </div>
        </button>
        {!isOfficial && otherId && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setWaDialogOpen(true)}
              className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shrink-0"
              title={ar ? "مشاركة رقم واتساب" : "Share WhatsApp number"}
            >
              <WhatsAppIcon size={18} className="text-emerald-600" />
            </button>
            <button
              onClick={() => (blockedByMe ? unblock() : block(otherName))}
              className="p-2 rounded-full hover:bg-muted shrink-0"
              title={blockedByMe ? t("unblockUser") : t("blockUser")}
            >
              <Ban size={18} className={blockedByMe ? "text-rose-500" : "text-muted-foreground"} />
            </button>
          </div>
        )}
        </div>
      </header>

      <PullToRefreshScroll onRefresh={loadAll} className="px-4 py-4 space-y-2">
        {acceptedOffer && !bothVerified && (
          <>
            {!otherTrusted && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{isSeller ? (ar ? "تلتقي مع مشترٍ غير موثّق — خطّط لقاءك بأمان عبر التطبيق" : "You're meeting an unverified buyer — plan your meetup safely through the app") : (ar ? "تلتقي مع بائع غير موثّق — خطّط لقاءك بأمان عبر التطبيق" : "You're meeting an unverified seller — plan your meetup safely through the app")}</span>
              </div>
            )}
            <MeetupFlow offer={acceptedOffer} user={user} lang={lang} otherName={otherName} meetup={acceptedMeetup} onMeetupChange={setAcceptedMeetup} />
          </>
        )}
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : timeline.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">{t("noChatsDesc")}</p>
        ) : (
          timeline.map((item, i) => {
            const showDate = shouldShowSeparator(timeline, i);
            if (item.type === "offer") {
              const o = item;
              const mine = o.direction === "buyer_offer" ? o.buyer_id === user.id : o.seller_id === user.id;
              return (
                <React.Fragment key={`o-${o.id}`}>
                  {showDate && <ChatDateSeparator date={o.created_date} lang={lang} t={t} />}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <OfferCard offer={o} user={user} lang={lang} t={t} itemPrice={room?.item_price} itemImage={room?.item_image} itemTitle={room?.item_title} country={itemCountry}
                      ratedOffers={ratedOffers} onRate={setRatingOffer} onConfirm={confirmReceipt} onDispute={setDisputeOffer}
                      onAccept={acceptOffer} onReject={rejectOffer} onCounter={counterOffer} onModify={modifyOffer} onNotMatch={notMatchOffer}
                      onRequestMod={o.status === "accepted" && !offers.some((p) => p.status === "pending" && p.previous_offer_id === o.id) ? requestModification : undefined}
                      hasMeetup={hasMeetup && o.id === acceptedOffer?.id} meetupCompleted={meetupCompleted && o.id === acceptedOffer?.id} />
                  </div>
                </React.Fragment>
              );
            }
            if (item.type === "whatsapp") {
              const w = item;
              const mine = w.sender_id === user.id;
              const digits = w.phone.replace(/[^\d]/g, "");
              return (
                <React.Fragment key={`w-${w.id}`}>
                  {showDate && <ChatDateSeparator date={w.created_date} lang={lang} t={t} />}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <a
                      href={`https://wa.me/${digits}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`max-w-[75%] flex items-center gap-3 px-4 py-3 rounded-2xl ${mine ? "bg-emerald-600 text-white rounded-br-md" : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-bl-md"}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${mine ? "bg-white/20" : "bg-emerald-500 text-white"}`}>
                        <WhatsAppIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${mine ? "text-white/90" : "text-emerald-700 dark:text-emerald-300"}`}>{ar ? "بطاقة واتساب" : "WhatsApp contact"}</p>
                        <p className={`text-sm font-mono ${mine ? "text-white" : "text-foreground"}`} dir="ltr">{w.phone}</p>
                      </div>
                    </a>
                  </div>
                </React.Fragment>
              );
            }
            const m = item;
            if (m.sender_id === "system") {
              const offer = offers.find((o) => o.id === m.offer_id);
              const isBuyer = room?.buyer_id === user.id;
              const meetupDone = hasMeetup && acceptedMeetup?.status === "completed";
              const receiptReady = meetupDone || (!hasMeetup && Date.now() - new Date(offer?.updated_date || offer?.created_date || Date.now()).getTime() > 3600000);
              const needsConfirm = offer && offer.status === "accepted" && !offer.received_confirmed && isBuyer && receiptReady;
              const waiting = offer && offer.status === "accepted" && !offer.received_confirmed && !isBuyer;
              const canRate = offer && offer.status === "completed" && !ratedOffers.has(offer.id);
              const displayText = waiting ? t("agreedWaitingReceipt") : m.text;
              return (
                <React.Fragment key={`s-${i}`}>
                  {showDate && <ChatDateSeparator date={m.created_date} lang={lang} t={t} />}
                  <div className="flex justify-center">
                    <div className="max-w-[85%] rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-primary font-bold text-xs mb-1">
                        <ShieldCheck size={14} /> {t("adminName")}
                      </div>
                      <p className="text-sm">{displayText}</p>
                      {needsConfirm && (
                        <button onClick={() => confirmReceipt(offer)} className="mt-2.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 mx-auto">
                          <Check size={14} /> {t("confirmReceipt")}
                        </button>
                      )}
                      {canRate && (
                        <button onClick={() => setRatingOffer(offer)} className="mt-2.5 px-4 py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 mx-auto">
                          <Star size={14} /> {t("rateNow")}
                        </button>
                      )}
                      {offer && (offer.status === "accepted" || offer.status === "completed") && (
                        <button onClick={() => setDisputeOffer(offer)} className="mt-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 mx-auto">
                          <ShieldAlert size={14} /> {ar ? "فتح نزاع" : "Open dispute"}
                        </button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            }
            const mine = m.sender_id === user.id;
            const showName = !mine && (i === 0 || timeline[i - 1].sender_id !== m.sender_id);
            const showAvatar = showName && avatar;
            return (
              <React.Fragment key={`m-${i}`}>
                {showDate && <ChatDateSeparator date={m.created_date} lang={lang} t={t} />}
                <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 shrink-0">
                      {showAvatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                    {!mine && showName && otherName && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold mb-0.5 text-foreground/80">
                        {otherName}
                        {otherTrusted && <TrustedBadge size={12} />}
                      </p>
                    )}
                    <p className="whitespace-pre-line break-words">{m.text}</p>
                    <div className={`flex items-center gap-1 justify-end mt-1 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      <span className="text-[10px] leading-none">
                        {new Date(m.created_date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {mine && (() => {
                        const msgDate = new Date(m.created_date);
                        const otherSeen = otherLastSeen ? new Date(otherLastSeen) : null;
                        if (otherSeen && otherSeen > msgDate) return <CheckCheck size={13} className="text-sky-300" />;
                        if (otherSeen) return <CheckCheck size={13} className="opacity-60" />;
                        return <Check size={13} className="opacity-60" />;
                      })()}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={endRef} />
      </PullToRefreshScroll>

      <div className="p-3 border-t border-border/60 flex items-center gap-2 shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {isBlocked ? (
          <div className="flex-1 flex items-center justify-between gap-2 py-2.5 px-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-semibold">
            <span className="flex items-center gap-1.5"><Ban size={15} /> {blockedByMe ? t("blockedUserMsg") : t("blockedByThem")}</span>
            {blockedByMe && (
              <button onClick={unblock} className="text-xs font-bold underline">{t("unblockUser")}</button>
            )}
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              placeholder={t("typeMessage")}
              rows={1}
              className="flex-1 px-4 py-3 rounded-3xl bg-muted outline-none focus:ring-2 ring-primary/30 text-base resize-none max-h-[120px] overflow-y-auto leading-snug"
            />
            <button onClick={() => sendText()} disabled={!text.trim()} className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
              <Send size={18} className="rtl:-scale-x-100" />
            </button>
          </>
        )}
      </div>
      {waDialogOpen && (
        <WhatsAppContactDialog open={waDialogOpen} onClose={() => setWaDialogOpen(false)} chatroomId={id} user={user} lang={lang} buyerId={room?.buyer_id} sellerId={room?.seller_id} />
      )}
      {disputeOffer && (
        <DisputeDialog offer={disputeOffer} user={user} lang={lang} onClose={() => setDisputeOffer(null)} />
      )}
      {ratingOffer && (
        <RatingDialog
          offer={ratingOffer}
          user={user}
          lang={lang}
          onClose={() => setRatingOffer(null)}
          onDone={() => {
            setRatedOffers((prev) => new Set(prev).add(ratingOffer.id));
            setRatingOffer(null);
          }}
        />
      )}
    </div>
  );
}