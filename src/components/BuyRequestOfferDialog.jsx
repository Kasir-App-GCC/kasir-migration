import React, { useState } from "react";
import { X, ImagePlus, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import CurrencySymbol from "@/components/CurrencySymbol";
import { formatPrice } from "@/lib/format";

export default function BuyRequestOfferDialog({ req, user, lang, country, onClose, onSent }) {
  const { toast } = useToast();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [amount, setAmount] = useState(req.budget != null ? String(req.budget) : "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!image) {
      toast({ title: lang === "ar" ? "أضف صورة للمنتج" : "Please add an item picture", variant: "destructive" });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast({ title: lang === "ar" ? "أدخل السعر" : "Please enter a price", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: image });

      const existing = await base44.entities.ChatRoom.filter({
        item_id: req.id,
        seller_id: user.id,
        buyer_id: req.user_id,
      });
      let roomId;
      if (existing.length > 0) {
        roomId = existing[0].id;
      } else {
        const room = await base44.entities.ChatRoom.create({
          item_id: req.id,
          item_title: req.title,
          item_price: req.budget || 0,
          seller_id: user.id,
          seller_name: user.name,
          seller_avatar: user.avatar,
          buyer_id: req.user_id,
          buyer_name: req.user_name,
          buyer_avatar: req.user_avatar,
          hidden_for_buyer: true,
        });
        roomId = room.id;
      }

      await base44.entities.Offer.create({
        chatroom_id: roomId,
        item_id: req.id,
        item_title: req.title,
        buyer_id: req.user_id,
        buyer_name: req.user_name,
        seller_id: user.id,
        seller_name: user.name,
        amount: Number(amount),
        status: "pending",
        direction: "seller_counter",
        image: file_url,
      });

      const customMsg = message.trim();
      if (customMsg) {
        await base44.entities.Message.create({
          chatroom_id: roomId,
          sender_id: user.id,
          sender_name: user.name,
          text: customMsg,
        });
      }
      const lastMsg = customMsg || (lang === "ar" ? "تم إرسال عرض" : "Offer sent");
      await base44.entities.ChatRoom.update(roomId, { last_message: lastMsg, hidden_for_buyer: false, hidden_for_seller: false });

      const notifText = lang === "ar"
        ? `عرض جديد من ${user.name} على طلبك (${formatPrice(Number(amount), lang, country)})`
        : `New offer from ${user.name} (${formatPrice(Number(amount), lang, country)})`;
      base44.entities.Notification.create({
        user_id: req.user_id,
        type: "offer_received",
        text: notifText,
        item_id: req.id,
        item_title: req.title,
        chatroom_id: roomId,
        offer_amount: Number(amount),
        actor_name: user.name,
      }).catch(() => {});

      onSent(roomId);
    } catch {
      toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{lang === "ar" ? "أرسل عرضك" : "Send Your Offer"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        <div className="mb-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
          <p className="text-xs font-semibold text-muted-foreground mb-0.5">{lang === "ar" ? "الطلب" : "Request"}</p>
          <p className="text-sm font-bold">{req.title}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {lang === "ar" ? "صورة المنتج" : "Item picture"} *
            </label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="" className="w-full h-48 rounded-xl object-cover" />
                <button
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-48 rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition">
                <ImagePlus size={28} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{lang === "ar" ? "اضغط لإضافة صورة" : "Tap to add a picture"}</span>
                <input type="file" accept="image/*" onChange={pickImage} className="hidden" />
              </label>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {lang === "ar" ? "السعر" : "Price"} *
            </label>
            {req.budget != null && (
              <p className="text-xs text-muted-foreground mb-1.5">
                {lang === "ar" ? "ميزانية المشتري معروضة — يمكنك رفعها أو خفضها" : "Buyer's budget is shown — you can raise or lower it"}
              </p>
            )}
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder={lang === "ar" ? "مثال: 2000" : "e.g., 2000"}
                className="w-full ps-3 pe-8 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
              />
              <span className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground font-semibold pointer-events-none flex items-center">
                <CurrencySymbol country={country} lang={lang} size={14} />
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {lang === "ar" ? "رسالة (اختياري)" : "Message (optional)"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === "ar" ? "أي تفاصيل إضافية..." : "Any additional details..."}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full mt-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 hover:bg-violet-600 transition inline-flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {submitting ? (lang === "ar" ? "جاري الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال العرض" : "Send Offer")}
        </button>
      </div>
    </div>
  );
}