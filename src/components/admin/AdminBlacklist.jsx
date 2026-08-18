import React, { useEffect, useState } from "react";
import { ShieldX, Trash2, Mail, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";

export default function AdminBlacklist() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Blacklist.list("-created_date", 200);
        setEntries(list || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const remove = async (e) => {
    if (!window.confirm(ar ? "إزالة من القائمة السوداء؟" : "Remove from blacklist?")) return;
    try {
      await base44.entities.Blacklist.delete(e.id);
      setEntries((prev) => prev.filter((x) => x.id !== e.id));
      toast({ title: ar ? "تمت الإزالة" : "Removed" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <ShieldX size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا يوجد مستخدمون محظورون نهائياً" : "No blacklisted users"}</p>
        </div>
      ) : entries.map((e) => (
        <div key={e.id} className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
            <ShieldX size={18} className="text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{e.original_username || e.email}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
              {e.email && <span className="flex items-center gap-1"><Mail size={11} /> {e.email}</span>}
              {e.phone && <span className="flex items-center gap-1"><Phone size={11} /> {e.phone}</span>}
            </div>
            {e.reason && <p className="text-xs text-muted-foreground mt-0.5">{ar ? "السبب: " : "Reason: "}{e.reason}</p>}
            <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(e.created_date, lang)}</p>
          </div>
          <button onClick={() => remove(e)} className="w-8 h-8 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-center transition shrink-0">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}