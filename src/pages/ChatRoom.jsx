import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, ShieldCheck, Check, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import Price from "@/components/Price";
import OfferCard from "@/components/OfferCard";

export default function ChatRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang, setLastChatsSeen } = useStore();
  const t = useT();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [suggLoading, setSuggLoading] = useState(false);
  const endRef = useRef(null);
  const suggTimer = useRef(null);
  const lastSig = useRef("");

  const loadAll = useCallback(async () => {
    const [ms, ofs] = await Promise.all([
      base44.entities.Message.filter({ chatroom_id: id }, "created_date", 200),
      base44.entities.Offer.filter({ chatroom_id: id }, "created_date", 100),
    ]);
    setMessages(ms || []);
    setOffers(ofs || []);
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.ChatRoom.get(id);
        setRoom(r);
        await loadAll();
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers]);

  useEffect(() => { setLastChatsSeen(new Date().toISOString()); }, []);

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
    return () => { unsubM?.(); unsubO?.(); unsubR?.(); };
  }, [id]);

  const isSeller = room?.seller_id === user.id;
  const otherName = room ? (isSeller ? room.buyer_name : room.seller_name) : "";
  const otherAvatar = room ? (isSeller ? room.buyer_avatar : room.seller_avatar) : null;

  const fetchSuggestions = useCallback(async (msgs) => {
    if (!room || !user) return;
    const sig = msgs.map((m) => m.sender_id + ":" + m.text).join("|");
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    setSuggLoading(true);
    try {
      const res = await base44.functions.invoke("suggestReplies", {
        messages: msgs.map((m) => ({ sender_id: m.sender_id, text: m.text })),
        role: isSeller ? "seller" : "buyer",
        itemTitle: room.item_title,
        itemPrice: room.item_price,
      });
      const s = res?.data?.suggestions;
      setSuggestions(Array.isArray(s) && s.length ? s : []);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggLoading(false);
    }
  }, [room, user, isSeller]);

  useEffect(() => {
    if (suggTimer.current) clearTimeout(suggTimer.current);
    if (!messages.length) { setSuggestions([]); return; }
    suggTimer.current = setTimeout(() => fetchSuggestions(messages), 400);
    return () => clearTimeout(suggTimer.current);
  }, [messages, fetchSuggestions]);

  const sendText = async (value) => {
    const body = (value ?? text).trim();
    if (!body) return;
    const msg = { chatroom_id: id, sender_id: user.id, sender_name: user.name, text: body };
    setText("");
    setSuggestions([]);
    lastSig.current = "";
    try {
      await base44.entities.Message.create(msg);
      await base44.entities.ChatRoom.update(id, { last_message: msg.text });
    } catch {}
  };

  const sysMsg = (text, offerId) =>
    base44.entities.Message.create({ chatroom_id: id, sender_id: "system", sender_name: t("adminName"), text, kind: "system", offer_id: offerId || null });

  const acceptOffer = async (offer) => {
    await base44.entities.Offer.update(offer.id, { status: "accepted" });
    const txt = lang === "ar"
      ? `تم الاتفاق على السعر ${formatPrice(offer.amount, lang)} ✅`
      : `Price agreed at ${formatPrice(offer.amount, lang)} ✅`;
    await base44.entities.ChatRoom.update(id, { last_message: txt });
  };

  const rejectOffer = async (offer) => {
    await base44.entities.Offer.update(offer.id, { status: "rejected" });
    await base44.entities.ChatRoom.update(id, { last_message: lang === "ar" ? "تم رفض العرض" : "Offer rejected" });
  };

  const counterOffer = async (offer, amount) => {
    await base44.entities.Offer.update(offer.id, { status: "countered" });
    const direction = isSeller ? "seller_counter" : "buyer_offer";
    await base44.entities.Offer.create({
      chatroom_id: id,
      item_id: offer.item_id,
      item_title: offer.item_title,
      buyer_id: offer.buyer_id,
      buyer_name: offer.buyer_name,
      seller_id: offer.seller_id,
      seller_name: offer.seller_name,
      amount,
      status: "pending",
      direction,
      previous_offer_id: offer.id,
    });
    const preview = (isSeller
      ? (lang === "ar" ? `عارض البائع بسعر ${formatPrice(amount, lang)}` : `Seller counters at ${formatPrice(amount, lang)}`)
      : (lang === "ar" ? `عرض جديد بسعر ${formatPrice(amount, lang)}` : `New offer at ${formatPrice(amount, lang)}`));
    await base44.entities.ChatRoom.update(id, { last_message: preview });
  };

  const modifyOffer = async (offer, amount) => {
    await base44.entities.Offer.update(offer.id, { amount });
  };

  const confirmReceipt = async (offer) => {
    await base44.entities.Offer.update(offer.id, { status: "completed", received_confirmed: true });
    try {
      await base44.entities.Item.update(offer.item_id, { status: "sold", sold_to: offer.buyer_id, sold_to_name: offer.buyer_name });
    } catch {}
  };

  const timeline = [
    ...messages.map((m) => ({ type: "message", ...m })),
    ...offers.map((o) => ({ type: "offer", ...o })),
  ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      <header className="h-14 border-b border-border/60 flex items-center gap-3 px-4 bg-background/90 backdrop-blur shrink-0">
        <button onClick={() => nav("/chats")} className="p-1.5 rounded-full hover:bg-muted"><ArrowLeft size={20} className="rtl:rotate-180" /></button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {otherAvatar ? <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" /> : (otherName?.[0] || "?")}
        </div>
        <button
          onClick={() => nav(`/user/${isSeller ? room.buyer_id : room.seller_id}?name=${encodeURIComponent(otherName || "")}&avatar=${encodeURIComponent(otherAvatar || "")}`)}
          className="flex-1 min-w-0 text-start"
        >
          <p className="font-bold text-sm truncate">{otherName}</p>
          {room?.item_title && <p className="text-xs text-muted-foreground truncate">{room.item_title} · <Price value={room.item_price} lang={lang} /></p>}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : timeline.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">{t("noChatsDesc")}</p>
        ) : (
          timeline.map((item, i) => {
            if (item.type === "offer") {
              const o = item;
              const mine = o.direction === "buyer_offer" ? o.buyer_id === user.id : o.seller_id === user.id;
              return (
                <div key={`o-${o.id}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <OfferCard offer={o} user={user} lang={lang} t={t} itemPrice={room?.item_price}
                    onAccept={acceptOffer} onReject={rejectOffer} onCounter={counterOffer} onModify={modifyOffer} />
                </div>
              );
            }
            const m = item;
            if (m.sender_id === "system") {
              const offer = offers.find((o) => o.id === m.offer_id);
              const isBuyer = room?.buyer_id === user.id;
              const needsConfirm = offer && offer.status === "accepted" && !offer.received_confirmed && isBuyer;
              const waiting = offer && offer.status === "accepted" && !offer.received_confirmed && !isBuyer;
              const done = offer && offer.status === "completed";
              const displayText = waiting ? t("agreedWaitingReceipt") : m.text;
              return (
                <div key={`s-${i}`} className="flex justify-center">
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
                    {done && (
                      <button onClick={() => nav(`/item/${offer.item_id}`)} className="mt-2.5 px-4 py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 mx-auto">
                        <Star size={14} /> {t("rateNow")}
                      </button>
                    )}
                  </div>
                </div>
              );
            }
            const mine = m.sender_id === user.id;
            const showAvatar = !mine && otherAvatar && (i === 0 || timeline[i - 1].sender_id !== m.sender_id);
            return (
              <div key={`m-${i}`} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 shrink-0">
                    {showAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                  </div>
                )}
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 pt-2 pb-1.5 overflow-x-auto no-scrollbar shrink-0 min-h-[44px]">
        {suggLoading ? (
          <div className="flex gap-2 min-w-max">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="flex gap-2 min-w-max items-center">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendText(s)}
                className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-medium whitespace-nowrap transition"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-3 border-t border-border/60 flex items-center gap-2 pb-[env(safe-area-inset-bottom)] shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder={t("typeMessage")}
          className="flex-1 px-4 py-3 rounded-full bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
        />
        <button onClick={() => sendText()} disabled={!text.trim()} className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
          <Send size={18} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}