import React, { useEffect, useState } from "react";
import { LifeBuoy, Send, CheckCircle2, Clock, X, Paperclip } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";

const STATUS = {
  open: { en: "Open", ar: "مفتوحة", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  in_progress: { en: "In Progress", ar: "قيد المعالجة", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  resolved: { en: "Resolved", ar: "محلولة", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  closed: { en: "Closed", ar: "مغلقة", color: "bg-muted text-muted-foreground" },
};

export default function AdminTickets() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState({});
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.SupportTicket.list("-created_date", 200);
        setTickets(list || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const updateStatus = async (t, status) => {
    try {
      await base44.entities.SupportTicket.update(t.id, { status });
      setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, status } : x)));
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  const sendReply = async (t) => {
    const text = (reply[t.id] || "").trim();
    if (!text) return;
    try {
      await base44.entities.SupportTicket.update(t.id, { reply: text, status: "resolved" });
      if (t.user_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: t.user_email,
            subject: `Re: ${t.subject} — Kasir Support`,
            body: text,
          });
        } catch {}
      }
      try {
        await base44.entities.Notification.create({
          user_id: t.user_id,
          type: "support_resolved",
          text: text,
          actor_name: "Kasir Support",
        });
      } catch {}
      setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, reply: text, status: "resolved" } : x)));
      setReply((prev) => ({ ...prev, [t.id]: "" }));
      toast({ title: ar ? "تم إرسال الرد" : "Reply sent" });
    } catch {
      toast({ title: ar ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-muted rounded-xl text-sm">
        {["open", "in_progress", "resolved", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 px-3 py-1.5 rounded-lg font-semibold transition ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            {f === "all" ? (ar ? "الكل" : "All") : STATUS[f]?.[ar ? "ar" : "en"]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <LifeBuoy size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا توجد تذاكر" : "No tickets"}</p>
        </div>
      ) : filtered.map((t) => (
        <div key={t.id} className="rounded-2xl bg-card border border-border/60 p-3.5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{t.subject}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS[t.status]?.color}`}>{STATUS[t.status]?.[ar ? "ar" : "en"]}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.user_name || "—"} · {t.user_email || "—"}</p>
              {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(t.created_date, lang)}</span>
          </div>
          <p className="text-sm mt-1.5">{t.message}</p>
          {t.attachments?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg bg-muted text-xs font-semibold flex items-center gap-1 hover:bg-muted/70">
                  <Paperclip size={12} /> {ar ? "مرفق" : "Attachment"} {i + 1}
                </a>
              ))}
            </div>
          )}
          {t.reply && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">{ar ? "رد الإدارة" : "Admin reply"}</p>
              <p className="text-sm">{t.reply}</p>
            </div>
          )}
          {t.status !== "resolved" && t.status !== "closed" && (
            <div className="mt-2.5">
              <textarea
                value={reply[t.id] || ""}
                onChange={(e) => setReply((prev) => ({ ...prev, [t.id]: e.target.value }))}
                placeholder={ar ? "اكتب ردك…" : "Type your reply…"}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm resize-none"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button onClick={() => sendReply(t)} disabled={!reply[t.id]?.trim()} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"><Send size={13} className="rtl:rotate-180" /> {ar ? "رد" : "Reply"}</button>
                <button onClick={() => updateStatus(t, "in_progress")} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold flex items-center gap-1"><Clock size={13} /> {ar ? "قيد المعالجة" : "In Progress"}</button>
                <button onClick={() => updateStatus(t, "closed")} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold flex items-center gap-1"><X size={13} /> {ar ? "إغلاق" : "Close"}</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}