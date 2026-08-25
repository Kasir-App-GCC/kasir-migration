import React, { useEffect, useState } from "react";
import { X, ShieldCheck, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Price from "@/components/Price";

// Read-only conversation transcript for an admin reviewing a dispute.
// Loads the chatroom's messages + offers and renders them chronologically
// with clear buyer/seller labels — without the admin "joining" the chat.
export default function DisputeTranscript({ chatroomId, itemCountry, lang, ar, onClose }) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [r, ms, ofs] = await Promise.all([
          base44.entities.ChatRoom.get(chatroomId),
          base44.entities.Message.filter({ chatroom_id: chatroomId }, "created_date", 500),
          base44.entities.Offer.filter({ chatroom_id: chatroomId }, "created_date", 200),
        ]);
        if (!alive) return;
        setRoom(r);
        setMessages(ms || []);
        setOffers(ofs || []);
      } catch {
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [chatroomId]);

  const buyerName = room?.buyer_name || (ar ? "المشتري" : "Buyer");
  const sellerName = room?.seller_name || (ar ? "البائع" : "Seller");
  const country = itemCountry || room?.item_country || "SA";

  const timeline = [
    ...messages.map((m) => ({ type: "message", ...m })),
    ...offers.map((o) => ({ type: "offer", ...o })),
  ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const statusLabel = (s) => ({
    pending: ar ? "قيد الانتظار" : "Pending",
    accepted: ar ? "مقبول" : "Accepted",
    rejected: ar ? "مرفوض" : "Rejected",
    countered: ar ? "معارَض" : "Countered",
    completed: ar ? "مكتمل" : "Completed",
    not_match: ar ? "غير مطابق" : "Not a match",
  }[s] || s);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl h-[85vh] sm:h-[80vh] bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
          <div className="min-w-0">
            <p className="font-bold text-sm flex items-center gap-1.5"><ShieldCheck size={15} className="text-primary" /> {ar ? "تفريغ المحادثة" : "Conversation transcript"}</p>
            <p className="text-xs text-muted-foreground truncate">{room?.item_title || "—"}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted shrink-0"><X size={18} /></button>
        </div>

        {/* Parties */}
        <div className="px-4 py-2.5 border-b border-border/60 bg-muted/40 flex items-center gap-3 text-xs shrink-0">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> <span className="font-semibold">{buyerName}</span> <span className="text-muted-foreground">({ar ? "مشترٍ" : "buyer"})</span></span>
          <span className="text-muted-foreground">↔</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span className="font-semibold">{sellerName}</span> <span className="text-muted-foreground">({ar ? "بائع" : "seller"})</span></span>
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {loading ? (
            <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : timeline.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">{ar ? "لا توجد رسائل" : "No messages"}</p>
          ) : timeline.map((item, i) => {
            if (item.type === "offer") {
              const o = item;
              const fromBuyer = o.direction === "buyer_offer";
              const mine = false; // read-only
              return (
                <div key={`o-${o.id}`} className={`flex ${fromBuyer ? "justify-start" : "justify-end"}`}>
                  <div className="max-w-[80%] rounded-2xl bg-card border border-border/60 px-3 py-2 text-xs">
                    <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{fromBuyer ? buyerName : sellerName} · {ar ? "عرض" : "offer"}</p>
                    <p className="font-bold"><Price value={o.amount} lang={lang} country={country} /></p>
                    <p className="text-[10px] mt-0.5"><span className={`px-1.5 py-0.5 rounded font-bold ${o.status === "accepted" || o.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : o.status === "rejected" || o.status === "not_match" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-muted text-muted-foreground"}`}>{statusLabel(o.status)}</span></p>
                  </div>
                </div>
              );
            }
            const m = item;
            if (m.sender_id === "system" || m.kind === "system") {
              return (
                <div key={`s-${i}`} className="flex justify-center">
                  <div className="max-w-[85%] rounded-2xl bg-primary/5 border border-primary/20 px-3 py-2 text-center text-xs text-muted-foreground">{m.text}</div>
                </div>
              );
            }
            const fromBuyer = room && String(m.sender_id) === String(room.buyer_id);
            const senderName = fromBuyer ? buyerName : sellerName;
            return (
              <div key={`m-${i}`} className={`flex ${fromBuyer ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${fromBuyer ? "bg-sky-50 dark:bg-sky-950/30 rounded-bl-md" : "bg-amber-50 dark:bg-amber-950/30 rounded-br-md"}`}>
                  <p className="text-[10px] font-bold mb-0.5 text-muted-foreground">{senderName}</p>
                  <p className="whitespace-pre-line break-words">{m.text}</p>
                  <p className="text-[9px] text-muted-foreground text-end mt-0.5">{new Date(m.created_date).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5 shrink-0">
          <Tag size={12} /> {ar ? "هذا التفريغ للقراءة فقط ولا يُرسل أي رسالة." : "This transcript is read-only — no messages are sent."}
        </div>
      </div>
    </div>
  );
}