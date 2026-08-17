import React, { useEffect, useState } from "react";
import { X, Send, LifeBuoy, MessageSquare, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";

const CATEGORIES = [
  { id: "general", en: "General", ar: "عام" },
  { id: "technical", en: "Technical issue", ar: "مشكلة تقنية" },
  { id: "report", en: "Report a user", ar: "الإبلاغ عن مستخدم" },
  { id: "billing", en: "Billing", ar: "المدفوعات" },
  { id: "other", en: "Other", ar: "أخرى" },
];

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  closed: "bg-muted text-muted-foreground",
};

export default function ContactSupportDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const t = useT();
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const mine = await base44.entities.SupportTicket.filter({ user_id: user.id }, "-created_date", 20);
      setTickets(mine || []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTickets();
      setSuccess(false);
      setSubject("");
      setMessage("");
      setCategory("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!subject.trim() || !message.trim() || submitting) return;
    setSubmitting(true);
    try {
      await base44.entities.SupportTicket.create({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        category,
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
      });
      setSuccess(true);
      setSubject("");
      setMessage("");
      setCategory("general");
      loadTickets();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (s) => {
    const map = {
      open: lang === "ar" ? "مفتوح" : "Open",
      in_progress: lang === "ar" ? "قيد المعالجة" : "In progress",
      resolved: lang === "ar" ? "تم الحل" : "Resolved",
      closed: lang === "ar" ? "مغلق" : "Closed",
    };
    return map[s] || s;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <LifeBuoy size={20} className="text-primary" />
            {t("contactSupport")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        {success && (
          <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{t("ticketSubmitted")}</p>
          </div>
        )}

        {/* Existing tickets */}
        {tickets.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">{t("myTickets")}</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tickets.map((tk) => (
                <div key={tk.id} className="rounded-xl bg-muted/60 border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold truncate">{tk.subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[tk.status] || ""}`}>
                      {statusLabel(tk.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tk.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{timeAgo(tk.created_date, lang)}</span>
                    {tk.category && (
                      <span className="text-[10px] text-muted-foreground">
                        {CATEGORIES.find((c) => c.id === tk.category)?.[lang] || tk.category}
                      </span>
                    )}
                  </div>
                  {tk.reply && (
                    <div className="mt-2 pt-2 border-t border-border/60">
                      <p className="text-[10px] font-bold text-primary mb-0.5">{t("supportReply")}</p>
                      <p className="text-xs text-foreground">{tk.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingTickets && tickets.length === 0 && (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* New ticket form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportCategory")}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition ${category === c.id ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}
                >
                  {lang === "ar" ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportSubject")}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder={t("supportSubjectPlaceholder")}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportMessage")}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              maxLength={1000}
              rows={4}
              placeholder={t("supportMessagePlaceholder")}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none"
            />
            <div className="flex justify-end text-[11px] text-muted-foreground mt-1">{(message || "").length}/1000</div>
          </div>

          <button
            onClick={submit}
            disabled={!subject.trim() || !message.trim() || submitting}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send size={18} className="rtl:rotate-180" /> {t("submitTicket")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}