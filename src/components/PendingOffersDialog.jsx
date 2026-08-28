import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MessageCircle, Loader2, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import Price from "@/components/Price";
import { timeAgo } from "@/lib/format";

// Lists pending offers on the signed-in seller's listings (incoming buyer
// offers awaiting action, plus the seller's own counters awaiting a buyer
// response). Tapping a row opens the chat where the offer can be
// accepted / countered / rejected — this dialog is a quick index, not a
// second action surface.
export default function PendingOffersDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    base44.entities.Offer.filter({ seller_id: user.id, status: "pending" }, "-created_date", 100)
      .then((list) => setOffers(list || []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            {ar ? "العروض المعلّقة" : "Pending offers"}
          </DialogTitle>
          <DialogDescription>
            {ar ? "عروض بانتظار ردّك على إعلاناتك." : "Offers awaiting your response on your listings."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : offers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Clock size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold">{ar ? "لا توجد عروض معلّقة" : "No pending offers"}</p>
            <p className="text-xs mt-1">{ar ? "ستظهر هنا العروض الجديدة من المشترين." : "New buyer offers will show up here."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {offers.map((o) => {
              const incoming = o.direction === "buyer_offer";
              return (
                <button
                  key={o.id}
                  onClick={() => { onClose?.(); nav(`/chat/${o.chatroom_id}`); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/60 hover:bg-muted/50 transition text-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Tag size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{o.item_title || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.buyer_name || "—"} · {timeAgo(o.created_date, lang)}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-extrabold"><Price value={o.amount} lang={lang} country="SA" /></p>
                    <span className={`text-[10px] font-bold ${incoming ? "text-amber-600" : "text-muted-foreground"}`}>
                      {incoming ? (ar ? "بانتظار ردّك" : "Awaiting you") : (ar ? "بانتظار المشتري" : "Awaiting buyer")}
                    </span>
                  </div>
                  <MessageCircle size={16} className="text-muted-foreground shrink-0 rtl:rotate-180" />
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}