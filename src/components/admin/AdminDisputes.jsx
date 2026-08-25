import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, MessageCircle, Tag, User, Clock, Coins } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import Price from "@/components/Price";
import DisputeTranscript from "@/components/admin/DisputeTranscript";

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
  const [offerMap, setOfferMap] = useState({});
  const [transcriptFor, setTranscriptFor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Dispute.list("-created_date", 200);
      setDisputes(list || []);
      // Fetch the related offers (for amounts) — disputes are few, so a
      // parallel fetch is fine.
      const ids = Array.from(new Set((list || []).map((d) => d.offer_id).filter(Boolean)));
      if (ids.length) {
        const offers = await Promise.all(ids.map((id) => base44.entities.Offer.get(id).catch(() => null)));
        setOfferMap((prev) => {
          const next = { ...prev };
          offers.forEach((o) => { if (o && o.id) next[o.id] = o; });
          return next;
        });
      }
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
          <div key={d.id} className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5"><ShieldAlert size={15} className="text-rose-500" /> {d.item_title || "—"}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${d.status === "resolved" || d.status === "closed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : d.status === "open" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{d.status}</span>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 px-2.5 py-2">
                <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">{ar ? "المُشتكي" : "Complainant"}</p>
                <p className="font-semibold truncate">{d.complainant_name || "—"}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 px-2.5 py-2">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{ar ? "الطرف الآخر" : "Respondent"}</p>
                <p className="font-semibold truncate">{d.respondent_name || "—"}</p>
              </div>
            </div>

            {/* Offer + time */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {timeAgo(d.created_date, lang)}</span>
              {offerMap[d.offer_id] && (
                <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Coins size={12} /> <Price value={offerMap[d.offer_id].amount} lang={lang} country={offerMap[d.offer_id].item_country || "SA"} /> · {ar ? "العرض المتفق عليه" : "agreed offer"}</span>
              )}
            </div>

            {/* Reason + description */}
            <div className="space-y-1">
              <p className="text-sm"><span className="font-semibold">{ar ? "السبب" : "Reason"}:</span> {d.reason}</p>
              {d.description && (
                <div className="rounded-xl bg-muted/60 p-2.5 text-sm text-foreground/90 leading-relaxed selectable whitespace-pre-line">{d.description}</div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {d.chatroom_id && (
                <button onClick={() => setTranscriptFor(d)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold">
                  <MessageCircle size={12} /> {ar ? "تفريغ المحادثة" : "View transcript"}
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
      {transcriptFor && (
        <DisputeTranscript
          chatroomId={transcriptFor.chatroom_id}
          itemCountry={offerMap[transcriptFor.offer_id]?.item_country}
          lang={lang}
          ar={ar}
          onClose={() => setTranscriptFor(null)}
        />
      )}
    </div>
  );
}