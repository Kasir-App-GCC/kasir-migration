import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, MessageCircle, Tag, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";

// Admin moderation board for disputes. Admins set a resolution status + reply,
// which notifies the complainant.
export default function AdminDisputes() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState({});
  const [filter, setFilter] = useState("open");

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Dispute.list("-created_date", 200);
      setDisputes(list || []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const resolve = async (d, status) => {
    const txt = (reply[d.id] || "").trim();
    if (!txt) {
      alert(ar ? "اكتب رد الإدارة" : "Write an admin reply");
      return;
    }
    try {
      await base44.entities.Dispute.update(d.id, { status, admin_reply: txt });
      await base44.entities.Notification.create({
        user_id: d.complainant_id,
        type: "dispute_resolved",
        text: ar ? `تم البت في نزاعك على "${d.item_title || ""}"` : `Your dispute on "${d.item_title || ""}" was resolved`,
        item_id: d.item_id || null,
        item_title: d.item_title || "",
        chatroom_id: d.chatroom_id || null,
        actor_name: "Admin",
      });
      setReply((p) => ({ ...p, [d.id]: "" }));
      load();
    } catch {}
  };

  const filtered = disputes.filter((d) => (filter === "all" ? true : d.status === filter));

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {[["open", ar ? "مفتوحة" : "Open"], ["in_progress", ar ? "قيد النظر" : "In progress"], ["resolved", ar ? "محلولة" : "Resolved"], ["all", ar ? "الكل" : "All"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${filter === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{label}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground text-sm">{ar ? "لا توجد نزاعات" : "No disputes"}</p>
      ) : (
        filtered.map((d) => (
          <div key={d.id} className="rounded-2xl bg-card border border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5"><ShieldAlert size={15} className="text-rose-500" /> {d.item_title || "—"}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${d.status === "resolved" ? "bg-emerald-100 text-emerald-700" : d.status === "open" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{d.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">{ar ? "من" : "By"}: {d.complainant_name} → {d.respondent_name} · {timeAgo(d.created_date, lang)}</p>
            <p className="text-sm"><span className="font-semibold">{ar ? "السبب" : "Reason"}:</span> {d.reason}</p>
            {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {d.chatroom_id && (
                <button onClick={() => nav(`/chat/${d.chatroom_id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-xs font-semibold">
                  <MessageCircle size={12} /> {ar ? "المحادثة" : "Chat"}
                </button>
              )}
              {d.item_id && (
                <button onClick={() => nav(`/item/${d.item_id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-xs font-semibold">
                  <Tag size={12} /> {ar ? "الإعلان" : "Listing"}
                </button>
              )}
              {d.complainant_id && (
                <button onClick={() => nav(`/user/${d.complainant_id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-xs font-semibold">
                  <User size={12} /> {d.complainant_name || (ar ? "المُشتكي" : "Complainant")}
                </button>
              )}
              {d.respondent_id && (
                <button onClick={() => nav(`/user/${d.respondent_id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-xs font-semibold">
                  <User size={12} /> {d.respondent_name || (ar ? "الطرف الآخر" : "Respondent")}
                </button>
              )}
            </div>
            {d.admin_reply && (
              <div className="text-sm ps-2 border-s-2 border-primary/30">
                <span className="font-semibold text-primary">{ar ? "رد الإدارة" : "Admin"}:</span> {d.admin_reply}
              </div>
            )}
            {d.status !== "resolved" && d.status !== "closed" && (
              <div className="space-y-1.5">
                <input
                  value={reply[d.id] || ""}
                  onChange={(e) => setReply((p) => ({ ...p, [d.id]: e.target.value }))}
                  placeholder={ar ? "رد الإدارة..." : "Admin reply..."}
                  className="w-full px-3 py-2 rounded-xl bg-muted outline-none text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => resolve(d, "resolved")} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">{ar ? "حل" : "Resolve"}</button>
                  <button onClick={() => resolve(d, "closed")} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold">{ar ? "إغلاق" : "Close"}</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}