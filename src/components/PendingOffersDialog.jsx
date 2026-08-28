import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MessageCircle, Loader2, Tag, ArrowLeftRight, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import Price from "@/components/Price";
import { timeAgo } from "@/lib/format";
import { Image } from "@/components/ui/image";

// Lists pending offers on the signed-in seller's listings (incoming buyer
// offers awaiting action, plus the seller's own counters awaiting a buyer
// response). Each card shows the item image, buyer name, and offer amount
// so it's obvious what the offer is for and who sent it. Tapping a card
// opens the chat where the offer can be accepted / countered / rejected.
export default function PendingOffersDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [offers, setOffers] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    base44.entities.Offer.filter({ seller_id: user.id, status: "pending" }, "-created_date", 100)
      .then(async (list) => {
        setOffers(list || []);
        // Bulk-fetch item images so each card shows what the offer is for.
        const itemIds = [...new Set((list || []).map((o) => o.item_id).filter(Boolean))];
        if (itemIds.length === 0) { setItems({}); return; }
        try {
          const fetched = await base44.entities.Item.filter({ id: { $in: itemIds } }, "-created_date", itemIds.length);
          const map = {};
          (fetched || []).forEach((it) => { map[it.id] = it; });
          setItems(map);
        } catch { setItems({}); }
      })
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
          <div className="space-y-2.5">
            {offers.map((o) => {
              const incoming = o.direction === "buyer_offer";
              const item = items[o.item_id];
              const itemImg = o.image || item?.images?.[0];
              const itemPrice = item?.price;
              return (
                <button
                  key={o.id}
                  onClick={() => { onClose?.(); nav(`/chat/${o.chatroom_id}`); }}
                  className="w-full flex gap-3 p-2.5 rounded-2xl border border-border/60 hover:bg-muted/50 hover:border-border transition text-start"
                >
                  {/* Item thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                    {itemImg ? (
                      <Image src={itemImg} alt={o.item_title || ""} fittingType="fill" className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Tag size={20} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold line-clamp-1">{o.item_title || "—"}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User size={9} className="text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {o.buyer_name || (ar ? "مشترٍ" : "Buyer")}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">· {timeAgo(o.created_date, lang)}</span>
                      </div>
                    </div>

                    {/* Offer amount + direction */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/40">
                        <Tag size={11} className="text-amber-600" />
                        <span className="text-sm font-extrabold"><Price value={o.amount} lang={lang} country={item?.country || "SA"} /></span>
                      </div>
                      {itemPrice != null && Number(itemPrice) !== Number(o.amount) && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          <Price value={itemPrice} lang={lang} country={item?.country || "SA"} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direction badge */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      incoming
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {incoming
                        ? (ar ? "بانتظار ردّك" : "Awaiting you")
                        : (<><ArrowLeftRight size={9} /> {ar ? "ردّك على المشتري" : "Your counter"}</>)
                      }
                    </span>
                    <MessageCircle size={16} className="text-muted-foreground rtl:rotate-180" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}