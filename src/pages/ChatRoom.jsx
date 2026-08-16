import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

export default function ChatRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang, setLastChatsSeen } = useStore();
  const t = useT();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.ChatRoom.get(id);
        setRoom(r);
        const ms = await base44.entities.Message.filter({ chatroom_id: id }, "created_date", 200);
        setMessages(ms || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { setLastChatsSeen(new Date().toISOString()); }, []);

  const send = async () => {
    if (!text.trim()) return;
    const msg = { chatroom_id: id, sender_id: user.id, sender_name: user.name, text: text.trim() };
    setText("");
    setMessages((m) => [...m, msg]);
    try {
      await base44.entities.Message.create(msg);
      await base44.entities.ChatRoom.update(id, { last_message: msg.text });
    } catch {}
  };

  const otherName = room ? (room.seller_id === user.id ? room.buyer_name : room.seller_name) : "";
  const isSeller = room?.seller_id === user.id;
  const suggestions = isSeller
    ? [
        { ar: "نعم، متوفر", en: "Yes, it's available" },
        { ar: "السعر نهائي", en: "Price is firm" },
        { ar: "متى تقدر تلتقي؟", en: "When can you meet?" },
        { ar: "وين موقعك؟", en: "Where are you located?" },
      ]
    : [
        { ar: "هل ما زال متوفر؟", en: "Is it still available?" },
        { ar: "كم آخر سعر؟", en: "What's your last price?" },
        { ar: "وين نقدر نلتقي؟", en: "Where can we meet?" },
        { ar: "تقدر توصل؟", en: "Can you deliver?" },
      ];

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      <header className="h-14 border-b border-border/60 flex items-center gap-3 px-4 bg-background/90 backdrop-blur shrink-0">
        <button onClick={() => nav("/chats")} className="p-1.5 rounded-full hover:bg-muted"><ArrowLeft size={20} className="rtl:rotate-180" /></button>
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{otherName?.[0] || "?"}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{otherName}</p>
          {room?.item_title && <p className="text-xs text-muted-foreground truncate">{room.item_title} · {formatPrice(room.item_price, lang)}</p>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">{t("noChatsDesc")}</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 pt-2 pb-1.5 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex gap-2 min-w-max">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setText(lang === "ar" ? s.ar : s.en)}
              className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-xs font-medium whitespace-nowrap"
            >
              {lang === "ar" ? s.ar : s.en}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-border/60 flex items-center gap-2 pb-[env(safe-area-inset-bottom)] shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("typeMessage")}
          className="flex-1 px-4 py-3 rounded-full bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
        />
        <button onClick={send} disabled={!text.trim()} className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
          <Send size={18} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}