import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ShieldCheck, Check, CheckCheck, BadgeCheck, Ban, MessageCircle, Clock, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import Price from "@/components/Price";
import OfferCard from "@/components/OfferCard";
import TrustedBadge from "@/components/TrustedBadge";
import PullToRefresh from "@/components/PullToRefresh";
import { haptic } from "@/lib/haptics";
import { timeAgo } from "@/lib/format";
import RatingDialog from "@/components/RatingDialog";
import DisputeDialog from "@/components/DisputeDialog";
import DealCard from "@/components/DealCard";
import confetti from "canvas-confetti";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import WhatsAppContactDialog from "@/components/WhatsAppContactDialog";
import ChatDateSeparator, { shouldShowSeparator } from "@/components/ChatDateSeparator";
import TypingIndicator from "@/components/TypingIndicator";
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
  const [, setTick] = useState(0);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const scrollRef = useRef(null);
  const msgElsRef = useRef(new Map());
  const messagesIndexRef = useRef(new Map());

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
    // Fetch the three timeline streams in parallel. A failure in any one
    // degrades to an empty list rather than hanging the whole chat render.
    const [ms, ofs, was] = await Promise.all([
      base44.entities.Message.filter({ chatroom_id: id }, "-created_date", 200).catch(() => []),
      base44.entities.Offer.filter({ chatroom_id: id }, "-created_date", 100).catch(() => []),
      base44.entities.WhatsAppContact.filter({ chatroom_id: id }, "-created_date", 100).catch(() => []),
    ]);
    setMessages(ms || []);
    setOffers(ofs || []);
    setWaContacts(was || []);
    // Non-blocking: fetch ratings in the background so a slow query doesn't
    // stall the chat. The rating state updates when the promise resolves.
    if (ofs && ofs.length && user?.id) {
      const offerIds = ofs.map((o) => o.id);
      base44.entities.Rating.filter({ rater_user_id: user.id, offer_id: { $in: offerIds } }, "-created_date", 100)
        .then((ratings) => setRatedOffers(new Set((ratings || []).map((r) => r.offer_id))))
        .catch(() => {});
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
        // Non-blocking: fetch the other party's profile in the background so
        // a slow/hanging backend function never stalls the chat render. The
        // trusted badge and avatar pop in when the promise resolves.
        if (otherId) {
          base44.functions.invoke("getPublicProfile", { user_id: otherId })
            .then((p) => {
              setOtherTrusted(!!p?.data?.is_trusted);
              if (p?.data?.avatar) setOtherAvatar(p.data.avatar);
            })
            .catch(() => {});
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

  // Safety net: if the initial load hangs on a slow backend response, stop
  // showing the spinner after 8 seconds so the user sees the chat shell
  // instead of spinning forever. The polling effect fills in data when it lands.
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, [id]);

  useEffect(() => {
    const m = new Map();
    messages.forEach((msg, i) => m.set(msg.id, i));
    messagesIndexRef.current = m;
  }, [messages]);

  // Read receipts: mark messages from the other party as delivered on fetch,
  // and as read when they scroll into view (WhatsApp-style 3-state checks).
  useEffect(() => {
    if (!room || !user || !id) return;
    const otherMsgs = messages.filter((m) => m.sender_id !== "system" && String(m.sender_id) !== String(user.id));
    if (!otherMsgs.length) return;
    const toDeliver = otherMsgs.filter((m) => !m.delivered_at).map((m) => m.id);
    if (toDeliver.length) {
      base44.functions.invoke("markMessagesRead", { chatroom_id: id, message_ids: toDeliver, field: "delivered_at" }).catch(() => {});
    }
    const obs = new IntersectionObserver((entries) => {
      const toRead = [];
      for (const e of entries) {
        if (e.isIntersecting) {
          const mid = e.target.dataset.msgId;
          if (mid) { toRead.push(mid); obs.unobserve(e.target); }
        }
      }
      if (toRead.length) {
        base44.functions.invoke("markMessagesRead", { chatroom_id: id, message_ids: toRead, field: "read_at" }).catch(() => {});
      }
    }, { root: scrollRef.current, threshold: 0.5 });
    msgElsRef.current.forEach((el, mid) => {
      const msg = messages.find((m) => m.id === mid);
      if (msg && !msg.read_at) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [messages, room, user, id]);

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
        let i = messagesIndexRef.current.get(m.id);
        if (i == null || i >= prev.length || prev[i]?.id !== m.id) {
          i = prev.findIndex((x) => x.id === m.id);
        }
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

  // Tick every second so the other party's typing indicator (which expires
  // after 5s) stops showing without waiting for a new event.
  useEffect(() => {
    let interval = null;
    const start = () => { if (!interval) interval = setInterval(() => setTick((t) => t + 1), 1000); };
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    const onVis = () => { if (document.hidden) stop(); else start(); };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Debounced typing indicator: set typing_at on first keystroke, auto-clear
  // after 3s of inactivity or on send. The other party sees animated dots
  // while their timestamp is within the last 5 seconds.
  const updateTyping = (typing) => {
    if (!room || !user || isOfficial) return;
    const field = isSeller ? "seller_typing_at" : "buyer_typing_at";
    if (typing) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        base44.entities.ChatRoom.update(id, { [field]: new Date().toISOString() }).catch(() => {});
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        base44.entities.ChatRoom.update(id, { [field]: null }).catch(() => {});
      }, 3000);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        base44.entities.ChatRoom.update(id, { [field]: null }).catch(() => {});
      }
    }
  };

  const otherTypingAt = room ? (isSeller ? room.buyer_typing_at : room.seller_typing_at) : null;
  const isOtherTyping = !!otherTypingAt && (Date.now() - new Date(otherTypingAt).getTime() < 5000);
  const otherOnline = isOtherTyping || (!!otherLastSeen && Date.now() - new Date(otherLastSeen).getTime() < 60000);

  // Polling safety net: re-fetch offers + messages every 7s so status changes
  // land even if a realtime subscription event is missed (service-role writes
  // can occasionally not trigger the client subscription). Only updates state
  // when something actually changed — no-op polls don't cause re-renders.
  useEffect(() => {
    let interval = null;
    const poll = async () => {
      try {
        const [ofs, ms] = await Promise.all([
          base44.entities.Offer.filter({ chatroom_id: id }, "created_date", 100),
          base44.entities.Message.filter({ chatroom_id: id }, "created_date", 200),
        ]);
        if (ofs) setOffers((prev) => {
          let changed = false;
          const map = new Map(prev.map((o) => [o.id, o]));
          for (const o of ofs) {
            const existing = map.get(o.id);
            if (!existing || existing.status !== o.status || existing.amount !== o.amount || existing.received_confirmed !== o.received_confirmed) {
              map.set(o.id, o); changed = true;
            }
          }
          if (!changed) return prev;
          return Array.from(map.values()).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        });
        if (ms) setMessages((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          let changed = false;
          for (const m of ms) {
            if (!map.has(m.id)) { map.set(m.id, m); changed = true; }
          }
          if (!changed) return prev;
          return Array.from(map.values()).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        });
      } catch {}
    };
    const start = () => { if (!interval) interval = setInterval(poll, 7000); };
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    const onVis = () => { if (document.hidden) stop(); else start(); };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [id]);

  const goToProfile = () => {
    if (!otherId || isOfficial) return;
    nav(`/user/${otherId}?name=${encodeURIComponent(otherName || "")}&avatar=${encodeURIComponent(avatar || "")}`);
  };

  const sendText = async (value) => {
    if (isBlocked) return;
    updateTyping(false);
    const body = (value ?? text).trim();
    if (!body) return;
    setText("");
    // Optimistic insert with a sending indicator so the bubble appears
    // instantly; replaced by the real message once the backend confirms.
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = {
      id: tempId,
      chatroom_id: id,
      sender_id: user?.id,
      sender_name: user?.name,
      text: body,
      kind: "text",
      created_date: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await base44.functions.invoke("sendMessage", { chatroom_id: id, text: body });
      const msg = res?.data?.message;
      if (msg) setMessages((prev) => {
        // Remove the optimistic temp, then upsert the real message — avoids
        // a duplicate when the realtime subscription already inserted it.
        const next = prev.filter((x) => x.id !== tempId);
        const j = next.findIndex((x) => x.id === msg.id);
        if (j === -1) return [...next, msg];
        const copy = [...next]; copy[j] = msg; return copy;
      });
    } catch {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, _pending: false, _failed: true } : m));
    }
  };

  const sendWhatsAppCard = async () => {
    if (!room) return;
    // Auto-send the verified WhatsApp number as a card; otherwise open the
    // dialog so the user can type a number to share.
    if (user?.whatsapp_verified && user?.whatsapp_number) {
      const e164 = "+" + String(user.whatsapp_number).replace(/[^\d]/g, "");
      try {
        await base44.entities.WhatsAppContact.create({
          chatroom_id: id,
          buyer_id: room.buyer_id || null,
          seller_id: room.seller_id || null,
          sender_id: user.id,
          sender_name: user.name,
          phone: e164,
        });
        await base44.entities.ChatRoom.update(id, {
          last_message: ar ? "تم إرسال بطاقة واتساب" : "WhatsApp contact shared",
          hidden_for_buyer: false,
          hidden_for_seller: false,
        });
      } catch {}
    } else {
      setWaDialogOpen(true);
    }
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
    try { await base44.functions.invoke("manageOffer", { action: "accept", offer_id: offer.id }); } catch {}
    try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#10b981", "#fbbf24", "#3b82f6"] }); } catch {}
    try { await base44.entities.ChatRoom.update(id, { last_message: agreeTxt, hidden_for_buyer: false, hidden_for_seller: false }); } catch {}
    haptic(10);
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
    haptic(10);
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
    haptic(10);
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
    haptic(10);
  };

  const confirmReceipt = async (offer) => {
    try { await base44.functions.invoke("manageOffer", { action: "confirm_receipt", offer_id: offer.id }); } catch {}
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: "completed", received_confirmed: true } : o)));
    haptic(10);
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
            ) : isOtherTyping ? (
              <p className="text-xs text-primary font-semibold truncate flex items-center gap-1">
                <TypingIndicator lang={lang} />
              </p>
            ) : otherOnline ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {ar ? "متصل" : "online"}
              </p>
            ) : otherLastSeen ? (
              <p className="text-xs text-muted-foreground truncate">{ar ? "آخر ظهور" : "Last seen"} {timeAgo(otherLastSeen, lang)}</p>
            ) : room?.item_title ? (
              <p className="text-xs text-muted-foreground truncate">{room.item_title} · <Price value={room.item_price} lang={lang} country={itemCountry} /></p>
            ) : null}
          </div>
        </button>
        {!isOfficial && otherId && (
          <div className="flex items-center gap-1 shrink-0">
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

      <PullToRefresh scrollRef={scrollRef} onRefresh={loadAll} className="px-4 py-4 space-y-2">
        {acceptedOffer && (
          <DealCard
            offer={acceptedOffer}
            user={user}
            lang={lang}
            otherName={otherName}
            meetup={acceptedMeetup}
            onMeetupChange={setAcceptedMeetup}
            itemTitle={room?.item_title}
            itemCountry={itemCountry}
            otherTrusted={otherTrusted}
            ratedOffers={ratedOffers}
            onRate={setRatingOffer}
            onConfirm={confirmReceipt}
            onDispute={setDisputeOffer}
            onRequestMod={!offers.some((p) => p.status === "pending" && p.previous_offer_id === acceptedOffer.id) ? requestModification : undefined}
            hasMeetup={hasMeetup}
            meetupCompleted={meetupCompleted}
          />
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
                      onAccept={acceptOffer} onReject={rejectOffer} onCounter={counterOffer} onModify={modifyOffer} onNotMatch={notMatchOffer} />
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
              const waiting = offer && offer.status === "accepted" && !offer.received_confirmed && !isBuyer;
              const displayText = waiting ? t("agreedWaitingReceipt") : m.text;
              return (
                <React.Fragment key={`s-${i}`}>
                  {showDate && <ChatDateSeparator date={m.created_date} lang={lang} t={t} />}
                  <div className="flex justify-center">
                    <div className="max-w-[85%] flex items-center gap-2 rounded-2xl bg-primary/5 border border-primary/15 px-3 py-2">
                      <ShieldCheck size={14} className="text-primary/50 shrink-0" />
                      <p className="text-xs text-muted-foreground">{displayText}</p>
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
                  <div ref={!mine ? (el) => {
                    if (el) { el.dataset.msgId = m.id; msgElsRef.current.set(m.id, el); }
                    else msgElsRef.current.delete(m.id);
                  } : undefined} className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 ${mine ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
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
                        if (m._pending) return <Clock size={13} className="opacity-60 animate-pulse" />;
                        if (m._failed) return <AlertCircle size={13} className="text-rose-300" />;
                        if (m.read_at) return <CheckCheck size={13} className="text-sky-300" />;
                        if (m.delivered_at) return <CheckCheck size={13} className="opacity-60" />;
                        return <Check size={13} className="opacity-60" />;
                      })()}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        {isOtherTyping && (
          <div className="flex items-end gap-2 justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-6 h-6 rounded-full bg-primary/10 shrink-0" />
            <div className="px-4 py-3 rounded-2xl bg-muted rounded-bl-md">
              <TypingIndicator lang={lang} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </PullToRefresh>

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
            <button
              onClick={sendWhatsAppCard}
              className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0"
              title={ar ? "مشاركة رقم واتساب" : "Share WhatsApp number"}
            >
              <WhatsAppIcon size={20} />
            </button>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; updateTyping(true); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              onBlur={() => updateTyping(false)}
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