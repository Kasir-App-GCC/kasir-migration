import React, { useEffect, useState } from "react";
import { Flag, CheckCircle2, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";

export default function AdminReports() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Report.list("-created_date", 200);
        setReports(list || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resolve = async (r) => {
    try {
      await base44.entities.Report.update(r.id, { resolved: true });
      setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, resolved: true } : x)));
      const body = ar
        ? `مرحباً،\n\nتمت مراجعة بلاغك (${r.reason}) وتم اتخاذ الإجراء المناسب. شكراً لمساعدتك في الحفاظ على أمان مجتمع Kasir.\n\n— فريق Kasir`
        : `Hello,\n\nYour report (${r.reason}) has been reviewed and appropriate action has been taken. Thank you for helping keep the Kasir community safe.\n\n— Kasir Team`;
      base44.functions.invoke("notifyUser", {
        user_id: r.reporter_user_id,
        subject: ar ? "[Kasir] تم حل بلاغك" : "[Kasir] Your report has been resolved",
        body,
      }).catch(() => {});
      toast({ title: ar ? "تم حل البلاغ" : "Report resolved" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  const remove = async (r) => {
    if (!window.confirm(ar ? "حذف هذا البلاغ؟" : "Delete this report?")) return;
    try {
      await base44.entities.Report.delete(r.id);
      setReports((prev) => prev.filter((x) => x.id !== r.id));
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-2">
      {reports.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Flag size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا توجد بلاغات" : "No reports"}</p>
        </div>
      ) : reports.map((r) => (
        <div key={r.id} className={`rounded-2xl bg-card border p-3.5 ${r.resolved ? "border-border/40 opacity-60" : "border-rose-200 dark:border-rose-900"}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Flag size={14} className="text-rose-500 shrink-0" />
                <span className="font-semibold text-sm">{r.reason}</span>
                {r.resolved && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{ar ? "محلول" : "Resolved"}</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                {ar ? "ضد" : "Against"}: <span className="font-semibold">{r.reported_user_name || "—"}</span> · {ar ? "بواسطة" : "By"}: {r.reporter_user_id?.slice(-6) || "—"}
              </p>
              {r.details && <p className="text-sm mt-1.5">{r.details}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(r.created_date, lang)}</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            {r.item_id && <button onClick={() => nav(`/item/${r.item_id}`)} className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-xs font-semibold flex items-center gap-1"><Eye size={13} /> {ar ? "عرض الإعلان" : "View"}</button>}
            {!r.resolved && <button onClick={() => resolve(r)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={13} /> {ar ? "حل" : "Resolve"}</button>}
            <button onClick={() => remove(r)} className="px-3 py-1.5 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition"><Trash2 size={13} /> {ar ? "حذف" : "Delete"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}