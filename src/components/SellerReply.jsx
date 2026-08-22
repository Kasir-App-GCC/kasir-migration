import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

// Lets the rated seller post one public reply to a review about them, and
// shows the existing reply once posted. The reply is persisted through the
// `replyToReview` backend function (which enforces that only the rated seller
// can reply, and only once).
export default function SellerReply({ rating, lang }) {
  const ar = lang === "ar";
  const { toast } = useToast();
  const [posted, setPosted] = useState(rating.seller_reply || "");
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const text = reply.trim();
    if (!text) return;
    setSaving(true);
    try {
      await base44.functions.invoke("replyToReview", { rating_id: rating.id, reply: text });
      setPosted(text);
      setOpen(false);
      setReply("");
      toast({ title: ar ? "تم نشر الرد" : "Reply posted" });
    } catch {
      toast({ title: ar ? "فشل النشر" : "Failed to post", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (posted) {
    return (
      <div className="mt-2 ps-3 border-s-2 border-primary/30">
        <p className="text-[11px] font-bold text-primary mb-0.5">{ar ? "ردك" : "Your reply"}</p>
        <p className="text-sm text-muted-foreground">{posted}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1.5 text-xs font-semibold text-primary hover:underline">
        {ar ? "الرد على التقييم" : "Reply to review"}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={2}
        placeholder={ar ? "اكتب ردك..." : "Write your reply..."}
        className="w-full px-3 py-2 rounded-xl bg-muted outline-none text-sm resize-none"
      />
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving || !reply.trim()} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
          {saving ? (ar ? "جاري..." : "Saving...") : (ar ? "نشر" : "Post")}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg bg-muted text-xs">
          {ar ? "إلغاء" : "Cancel"}
        </button>
      </div>
    </div>
  );
}