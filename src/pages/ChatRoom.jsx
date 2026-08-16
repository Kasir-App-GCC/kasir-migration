import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import Price from "@/components/Price";

export default function ChatRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, lang, setLastChatsSeen } = useStore();
  const t = useT();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [suggLoading, setSuggLoading] = useState(false);
  const endRef = useRef(null);
  const suggTimer = useRef(null);
  const lastSig = useRef("");

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
    setMessages((m) => [...m, msg]);
    try {
      await base44.entities.Message.create(msg);
      await base44.entities.ChatRoom.update(id, { last_message: msg.text });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      <header className="h-14 border-b border-border/60 flex items-center gap-3 px-4 bg-background/90 backdrop-blur shrink-0">
        <button onClick={() => nav("/chats")} className="p-1.5 rounded-full hover:bg-muted"><ArrowLeft size={20} className="rtl:rotate-180" /></button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {otherAvatar ? <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" /> : (otherName?.[0] || "?")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{otherName}</p>
          {room?.item_title && <p className="text-xs text-muted-foreground truncate">{room.item_title} · <Price value={room.item_price} lang={lang} /></p>}
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
            const showAvatar = !mine && otherAvatar && (i === 0 || messages[i - 1].sender_id !== m.sender_id);
            return (
              <div key={i} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
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