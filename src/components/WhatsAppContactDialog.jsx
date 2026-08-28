import React, { useState, useEffect } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { COUNTRIES, getCountry } from "@/lib/countries";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useToast } from "@/components/ui/use-toast";

export default function WhatsAppContactDialog({ open, onClose, chatroomId, user, lang, buyerId, sellerId }) {
  const ar = lang === "ar";
  const { toast } = useToast();
  const [phoneCode, setPhoneCode] = useState("966");
  const [local, setLocal] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.country) {
      const c = getCountry(user.country);
      if (c?.phoneCode) setPhoneCode(c.phoneCode);
    }
  }, [user?.country]);

  if (!open) return null;

  const submit = async () => {
    const digits = local.replace(/\D/g, "").replace(/^0+/, "");
    if (!digits) {
      toast({ title: ar ? "أدخل رقمًا صحيحًا" : "Enter a valid number", variant: "destructive" });
      return;
    }
    const e164 = "+" + phoneCode + digits;
    setSending(true);
    try {
      await base44.entities.WhatsAppContact.create({
        chatroom_id: chatroomId,
        buyer_id: buyerId || null,
        seller_id: sellerId || null,
        sender_id: user.id,
        sender_name: user.name,
        phone: e164,
      });
      await base44.entities.ChatRoom.update(chatroomId, {
        last_message: ar ? "تم إرسال بطاقة واتساب" : "WhatsApp contact shared",
        hidden_for_buyer: false,
        hidden_for_seller: false,
      });
      setLocal("");
      onClose();
    } catch {
      toast({ title: ar ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <WhatsAppIcon size={20} className="text-emerald-600" />
            {ar ? "مشاركة رقم واتساب" : "Share WhatsApp number"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ar
            ? "أدخل رقمك ليتم إرساله كبطاقة للطرف الآخر. عند الضغط عليها يفتح واتساب مباشرة للتواصل."
            : "Enter your number to send as a card. Tapping it opens WhatsApp directly to chat."}
        </p>
        <div className="flex gap-2" dir="ltr">
          <div className="relative">
            <select
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              className="appearance-none pe-8 ps-3 py-3 rounded-xl bg-muted text-sm font-bold outline-none cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.phoneCode}>
                  {c.flag} +{c.phoneCode}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
            placeholder="512345678"
            dir="ltr"
            inputMode="tel"
            className="flex-1 px-3 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-emerald-500/30 text-sm"
          />
        </div>
        <button
          onClick={submit}
          disabled={sending}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <WhatsAppIcon size={18} />}
          {ar ? "إرسال البطاقة" : "Send contact card"}
        </button>
      </div>
    </div>
  );
}