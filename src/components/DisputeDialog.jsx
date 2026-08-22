import React, { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const REASONS = [
  { id: "not_received", en: "Item not received", ar: "لم أستلم السلعة" },
  { id: "not_paid", en: "Payment not received", ar: "لم أستلم المبلغ" },
  { id: "not_as_described", en: "Item not as described", ar: "السلعة غير مطابقة للوصف" },
  { id: "counterfeit", en: "Counterfeit / fake", ar: "مقلد أو مزيف" },
  { id: "other", en: "Other", ar: "سبب آخر" },
];

// Opens a dispute on an accepted/completed offer. The complainant is the
// current user; the respondent is the other party. Admin reviews from the
// Disputes board.
export default function DisputeDialog({ offer, user, lang, onClose }) {
  const ar = lang === "ar";
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const isSeller = String(offer.seller_id) === String(user.id);
  const respondentId = isSeller ? offer.buyer_id : offer.seller_id;
  const respondentName = isSeller ? offer.buyer_name : offer.seller_name;

  const submit = async () => {
    if (!reason) {
      toast({ title: ar ? "اختر السبب" : "Pick a reason", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Dispute.create({
        item_id: offer.item_id,
        item_title: offer.item_title,
        offer_id: offer.id,
        chatroom_id: offer.chatroom_id,
        complainant_id: user.id,
        complainant_name: user.name,
        respondent_id: respondentId,
        respondent_name: respondentName,
        reason,
        description: desc.trim(),
        status: "open",
      });
      toast({ title: ar ? "تم فتح النزاع — ستراجعه الإدارة" : "Dispute opened — admin will review" });
      onClose();
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><ShieldAlert size={18} className="text-rose-500" /> {ar ? "فتح نزاع" : "Open a dispute"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{ar ? "للعروض المقبولة أو المكتملة — ستتدخل الإدارة." : "For accepted/completed offers — admin will step in."}</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">{ar ? "السبب" : "Reason"} *</label>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium border transition ${reason === r.id ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}
                >
                  {ar ? r.ar : r.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{ar ? "تفاصيل" : "Details"}</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none text-sm resize-none"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={saving || !reason}
          className="w-full mt-4 py-3 rounded-xl bg-rose-600 text-white font-bold disabled:opacity-50"
        >
          {saving ? (ar ? "جاري..." : "Sending...") : (ar ? "إرسال النزاع" : "Submit dispute")}
        </button>
      </div>
    </div>
  );
}