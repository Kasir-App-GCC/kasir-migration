import React, { useEffect, useState } from "react";
import { X, Scale, ThumbsUp, ThumbsDown, ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";

// Shown to the complainant when they tap a "dispute_resolved" notification.
// Displays the admin's resolution and lets them mark it Satisfied (closes the
// dispute) or Unsatisfied with a reply (reopens it for admin re-review).
export default function DisputeReviewDialog({ disputeId, chatroomId, onClose }) {
  const { lang, user } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState(null); // null | "unsatisfied" (show reply box)
  const [reply, setReply] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let d = null;
        if (disputeId) {
          d = await base44.entities.Dispute.get(disputeId);
        } else if (chatroomId) {
          const list = await base44.entities.Dispute.filter({ chatroom_id: chatroomId }, "-created_date", 5);
          d = (list && list[0]) || null;
        }
        setDispute(d);
      } catch {} finally { setLoading(false); }
    })();
  }, [disputeId, chatroomId]);

  const submit = async (feedback) => {
    if (feedback === "unsatisfied" && !reply.trim()) {
      toast({ title: ar ? "اكتب ردك أولاً" : "Please write your reply first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await base44.functions.invoke("submitDisputeFeedback", {
        dispute_id: dispute.id || disputeId,
        feedback,
        reply: feedback === "unsatisfied" ? reply.trim() : "",
      });
      const fresh = await base44.entities.Dispute.get(dispute.id || disputeId);
      setDispute(fresh);
      setMode(null);
      setReply("");
      toast({ title: feedback === "satisfied" ? (ar ? "شكراً لك" : "Thank you") : (ar ? "تم إرسال ردك للمراجعة" : "Your reply was sent for review") });
    } catch (e) {
      const msg = String(e?.response?.data?.error || e?.message || "");
      if (msg.includes("already_submitted")) toast({ title: ar ? "تم إرسال رأيك مسبقاً" : "You already submitted feedback" });
      else toast({ title: ar ? "حدث خطأ" : "Something went wrong", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const statusLabel = (s) => ({
    open: ar ? "مفتوح" : "Open",
    in_progress: ar ? "قيد النظر" : "Under review",
    resolved: ar ? "تم البت" : "Resolved",
    closed: ar ? "مغلق" : "Closed",
  }[s] || s);

  const alreadyDone = !!dispute?.complainant_feedback;
  const isRespondent = !!user && !!dispute && String(dispute.respondent_id) === String(user.id);
  const isComplainant = !!user && !!dispute && String(dispute.complainant_id) === String(user.id);
  const [rReply, setRReply] = useState("");
  const [rSubmitting, setRSubmitting] = useState(false);

  const submitRespondent = async () => {
    if (!rReply.trim()) {
      toast({ title: ar ? "اكتب ردك أولاً" : "Please write your reply first", variant: "destructive" });
      return;
    }
    setRSubmitting(true);
    try {
      await base44.functions.invoke("respondDispute", { dispute_id: dispute.id || disputeId, reply: rReply.trim() });
      const fresh = await base44.entities.Dispute.get(dispute.id || disputeId);
      setDispute(fresh);
      setRReply("");
      toast({ title: ar ? "تم إرسال ردك للمراجعة" : "Your reply was sent for review" });
    } catch (e) {
      const msg = String(e?.response?.data?.error || e?.message || "");
      if (msg.includes("already_submitted")) toast({ title: ar ? "أرسلت ردك مسبقاً" : "You already submitted a reply" });
      else toast({ title: ar ? "حدث خطأ" : "Something went wrong", variant: "destructive" });
    } finally { setRSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
          <h3 className="font-bold text-base flex items-center gap-2"><Scale size={18} className="text-primary" /> {ar ? "حالة النزاع" : "Dispute status"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : !dispute ? (
            <p className="text-center text-muted-foreground py-10">{ar ? "تعذر العثور على النزاع" : "Dispute not found"}</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm truncate">{dispute.item_title || "—"}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${dispute.status === "resolved" || dispute.status === "closed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : dispute.status === "open" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{statusLabel(dispute.status)}</span>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {timeAgo(dispute.created_date, lang)}</div>

              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">{ar ? "السبب" : "Reason"}</p>
                <p className="text-sm">{dispute.reason}</p>
                {dispute.description && <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-line">{dispute.description}</p>}
              </div>

              {dispute.admin_reply ? (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <p className="text-[11px] font-bold text-primary uppercase mb-1 flex items-center gap-1"><ShieldCheck size={12} /> {ar ? "قرار الإدارة" : "Admin decision"}</p>
                  <p className="text-sm whitespace-pre-line">{dispute.admin_reply}</p>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Clock size={14} /> {ar ? "النزاع قيد النظر من الإدارة." : "Your dispute is under review by admin."}
                </div>
              )}

              {/* Respondent's side of the story */}
              {dispute.respondent_reply ? (
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">{ar ? "رد الطرف الآخر" : "The other party's reply"}</p>
                  <p className="text-sm whitespace-pre-line">{dispute.respondent_reply}</p>
                </div>
              ) : isRespondent ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><ShieldAlert size={13} className="text-rose-500" /> {ar ? "تم فتح نزاع ضدك — اكتب ردك" : "A dispute was opened against you — post your reply"}</p>
                  <textarea
                    value={rReply}
                    onChange={(e) => setRReply(e.target.value)}
                    rows={3}
                    placeholder={ar ? "اشرح وجهة نظرك..." : "Explain your side..."}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none text-sm resize-none"
                  />
                  <button onClick={submitRespondent} disabled={rSubmitting} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                    {rSubmitting ? (ar ? "جاري..." : "Sending...") : (ar ? "إرسال ردك" : "Submit your reply")}
                  </button>
                </div>
              ) : null}

              {/* Complainant feedback (only the complainant can act) */}
              {isComplainant && (alreadyDone ? (
                <div className={`rounded-xl p-3 text-sm ${dispute.complainant_feedback === "satisfied" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"}`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {dispute.complainant_feedback === "satisfied" ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                    {dispute.complainant_feedback === "satisfied" ? (ar ? "أنت راضٍ عن الحل" : "You marked this as satisfied") : (ar ? "أنت غير راضٍ — تم إعادة النظر" : "You marked this as unsatisfied — under re-review")}
                  </p>
                  {dispute.complainant_reply && <p className="mt-1.5 text-foreground/80 whitespace-pre-line">"{dispute.complainant_reply}"</p>}
                </div>
              ) : dispute.status === "resolved" ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck size={14} /> {ar ? "تم البت النهائي في النزاع من الإدارة." : "This dispute was closed by admin."}
                </div>
              ) : dispute.admin_reply ? (
                mode === "unsatisfied" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{ar ? "ردك" : "Your reply"} *</label>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder={ar ? "اشرح ما المشكلة..." : "Explain what's wrong..."}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => submit("unsatisfied")} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">
                        {submitting ? (ar ? "جاري..." : "Sending...") : (ar ? "إرسال" : "Submit")}
                      </button>
                      <button onClick={() => { setMode(null); setReply(""); }} className="px-3 py-2.5 rounded-xl bg-muted text-sm font-bold">{ar ? "إلغاء" : "Cancel"}</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => submit("satisfied")} disabled={submitting} className="py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold flex flex-col items-center gap-1 disabled:opacity-50">
                      <ThumbsUp size={18} /> {ar ? "راضٍ" : "Satisfied"}
                    </button>
                    <button onClick={() => setMode("unsatisfied")} disabled={submitting} className="py-3 rounded-xl bg-muted text-sm font-bold flex flex-col items-center gap-1">
                      <ThumbsDown size={18} /> {ar ? "غير راضٍ" : "Unsatisfied"}
                    </button>
                  </div>
                )
              ) : null)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}