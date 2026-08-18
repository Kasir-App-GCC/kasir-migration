import React, { useEffect, useState, useMemo } from "react";
import { Flag, CheckCircle2, Trash2, Eye, Ban, ShieldCheck, ShieldX, User as UserIcon, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { timeAgo } from "@/lib/format";

export default function AdminReports() {
  const { lang, user: adminUser } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState({});
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Report.list("-created_date", 200);
        setReports(list || []);
        // Fetch only the users referenced in these reports — not all 500 latest users.
        const userIds = [...new Set(
          (list || []).flatMap((r) => [r.reported_user_id, r.reporter_user_id]).filter(Boolean)
        )];
        if (userIds.length) {
          try {
            const res = await base44.functions.invoke("getUsersByIds", { ids: userIds });
            setUsers(res?.data?.users || {});
          } catch {}
        }
        // fetch related items
        const itemIds = [...new Set((list || []).map((r) => r.item_id).filter(Boolean))];
        if (itemIds.length) {
          const fetched = {};
          await Promise.all(itemIds.map(async (id) => {
            try { fetched[id] = await base44.entities.Item.get(id); } catch { fetched[id] = null; }
          }));
          setItems(fetched);
        }
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

  const deleteUser = async (u) => {
    if (!u) return;
    if (!window.confirm(ar ? `حذف ${u.username || u.email}؟ لا يمكن التراجع.` : `Delete ${u.username || u.email}? This cannot be undone.`)) return;
    setActing(u.id);
    try {
      const res = await base44.functions.invoke("deleteUser", { userId: u.id });
      if (!res.data?.success) throw new Error(res.data?.error || "Delete failed");
      toast({ title: ar ? "تم حذف المستخدم" : "User deleted" });
    } catch {
      toast({ title: ar ? "فشل الحذف" : "Delete failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const toggleBan = async (u) => {
    if (!u) return;
    setActing(u.id);
    try {
      const res = await base44.functions.invoke("updateUser", { userId: u.id, is_banned: !u.is_banned });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
      setUsers((prev) => ({ ...prev, [u.id]: { ...u, is_banned: !u.is_banned } }));
      toast({ title: !u.is_banned ? (ar ? "تم حظر المستخدم" : "User banned") : (ar ? "تم رفع الحظر" : "User unbanned") });
    } catch {
      toast({ title: ar ? "فشل التحديث" : "Update failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const toggleTrusted = async (u) => {
    if (!u) return;
    setActing(u.id);
    try {
      const res = await base44.functions.invoke("updateUser", { userId: u.id, is_trusted: !u.is_trusted });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
      setUsers((prev) => ({ ...prev, [u.id]: { ...u, is_trusted: !u.is_trusted } }));
      toast({ title: !u.is_trusted ? (ar ? "تم منح شارة الثقة" : "Trusted badge granted") : (ar ? "تم إزالة شارة الثقة" : "Trusted badge removed") });
    } catch {
      toast({ title: ar ? "فشل التحديث" : "Update failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const blacklistUser = async (u) => {
    if (!u) return;
    const reason = window.prompt(ar ? "سبب الحظر النهائي؟" : "Reason for permanent blacklist?", ar ? "مخالفة لشروط الاستخدام" : "Terms of service violation");
    if (reason === null) return;
    setActing(u.id);
    try {
      await base44.entities.Blacklist.create({
        email: (u.email || "").toLowerCase(),
        phone: (u.phone || "").replace(/\D/g, ""),
        reason: reason || "—",
        original_username: u.username || u.email,
      });
      const res = await base44.functions.invoke("deleteUser", { userId: u.id });
      if (!res.data?.success) throw new Error(res.data?.error || "Delete failed");
      toast({ title: ar ? "تم حظر وحذف المستخدم نهائياً" : "User blacklisted & deleted permanently" });
    } catch {
      toast({ title: ar ? "فشل الحظر" : "Blacklist failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const deleteItem = async (r) => {
    if (!r.item_id) return;
    if (!window.confirm(ar ? "حذف الإعلان المبلّغ عنه؟" : "Delete the reported listing?")) return;
    setActing(`item-${r.item_id}`);
    try {
      await base44.entities.Item.delete(r.item_id);
      await base44.entities.Report.update(r.id, { resolved: true });
      setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, resolved: true } : x)));
      toast({ title: ar ? "تم حذف الإعلان وحل البلاغ" : "Listing deleted & report resolved" });
    } catch {
      toast({ title: ar ? "فشل الحذف" : "Delete failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const markSold = async (r) => {
    if (!r.item_id) return;
    setActing(`item-${r.item_id}`);
    try {
      await base44.entities.Item.update(r.item_id, { status: "sold" });
      toast({ title: ar ? "تم تعليم الإعلان كمباع" : "Listing marked sold" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const reporter = (r) => users[r.reporter_user_id];
  const reported = (r) => users[r.reported_user_id];

  const UserChip = ({ u, role }) => {
    if (!u) return <span className="text-xs text-muted-foreground">{ar ? "غير معروف" : "Unknown"}</span>;
    return (
      <button onClick={() => nav(`/user/${u.id}`)} className="inline-flex items-center gap-1 text-xs hover:underline">
        <span className={`font-semibold ${role === "reported" ? "text-rose-600 dark:text-rose-400" : ""}`}>@{u.username || u.email}</span>
        {u.is_trusted && <ShieldCheck size={11} className="text-cyan-500" />}
        {u.is_banned && <Ban size={11} className="text-rose-500" />}
      </button>
    );
  };

  const ActionGroup = ({ u, prefix }) => {
    if (!u) return null;
    const busy = acting === u.id;
    return (
      <div className="flex flex-wrap gap-1">
        <button onClick={() => nav(`/user/${u.id}`)} disabled={busy} className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/70 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"><UserIcon size={11} /> {ar ? "عرض" : "View"}</button>
        <button onClick={() => toggleBan(u)} disabled={busy} className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50 ${u.is_banned ? "bg-rose-500 text-white" : "bg-muted hover:bg-muted/70"}`}><Ban size={11} /> {u.is_banned ? (ar ? "رفع الحظر" : "Unban") : (ar ? "حظر" : "Ban")}</button>
        <button onClick={() => toggleTrusted(u)} disabled={busy} className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50 ${u.is_trusted ? "bg-cyan-500 text-white" : "bg-muted hover:bg-muted/70"}`}><ShieldCheck size={11} /> {u.is_trusted ? (ar ? "إزالة الثقة" : "Untrust") : (ar ? "ثقة" : "Trust")}</button>
        <button onClick={() => blacklistUser(u)} disabled={busy} className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"><ShieldX size={11} /> {ar ? "حظر نهائي" : "Blacklist"}</button>
        <button onClick={() => deleteUser(u)} disabled={busy} className="px-2 py-1 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"><Trash2 size={11} /> {ar ? "حذف" : "Delete"}</button>
      </div>
    );
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-2">
      {reports.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Flag size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "لا توجد بلاغات" : "No reports"}</p>
        </div>
      ) : reports.map((r) => {
        const rep = reporter(r);
        const rpd = reported(r);
        const it = r.item_id ? items[r.item_id] : null;
        const itemBusy = acting === `item-${r.item_id}`;
        return (
        <div key={r.id} className={`rounded-2xl bg-card border p-3.5 ${r.resolved ? "border-border/40 opacity-60" : "border-rose-200 dark:border-rose-900"}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Flag size={14} className="text-rose-500 shrink-0" />
                <span className="font-semibold text-sm">{r.reason}</span>
                {r.resolved && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{ar ? "محلول" : "Resolved"}</span>}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{ar ? "ضد" : "Against"}:</span> <UserChip u={rpd} role="reported" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{ar ? "بواسطة" : "By"}:</span> <UserChip u={rep} />
                </div>
              </div>
              {r.details && <p className="text-sm mt-1.5">{r.details}</p>}
              {it && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <Package size={12} className="text-muted-foreground" />
                  <button onClick={() => nav(`/item/${r.item_id}`)} className="hover:underline truncate font-medium">{it.title}</button>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${it.status === "sold" ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
                    {it.status === "sold" ? (ar ? "مباع" : "Sold") : (ar ? "متاح" : "Available")}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(r.created_date, lang)}</p>
            </div>
          </div>

          {/* Actions against the post */}
          {r.item_id && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{ar ? "إجراءات على الإعلان" : "Post actions"}</p>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => nav(`/item/${r.item_id}`)} className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/70 text-[11px] font-semibold flex items-center gap-1"><Eye size={11} /> {ar ? "عرض" : "View"}</button>
                {it?.status !== "sold" && <button onClick={() => markSold(r)} disabled={itemBusy} className="px-2 py-1 rounded-lg bg-muted hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950/40 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"><Package size={11} /> {ar ? "تعليم كمباع" : "Mark sold"}</button>}
                <button onClick={() => deleteItem(r)} disabled={itemBusy} className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"><Trash2 size={11} /> {ar ? "حذف الإعلان" : "Delete post"}</button>
              </div>
            </div>
          )}

          {/* Actions against the reported user */}
          {rpd && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{ar ? "إجراءات على المستخدم المبلّغ عنه" : "Actions vs. reported user"}</p>
              <ActionGroup u={rpd} prefix="reported" />
            </div>
          )}

          {/* Actions against the submitter */}
          {rep && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{ar ? "إجراءات على مقدم البلاغ" : "Actions vs. submitter"}</p>
              <ActionGroup u={rep} prefix="reporter" />
            </div>
          )}

          <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/40">
            {!r.resolved && <button onClick={() => resolve(r)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={13} /> {ar ? "حل" : "Resolve"}</button>}
            <button onClick={() => remove(r)} className="px-3 py-1.5 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition"><Trash2 size={13} /> {ar ? "حذف البلاغ" : "Delete report"}</button>
          </div>
        </div>
        );
      })}
    </div>
  );
}