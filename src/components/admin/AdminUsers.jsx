import React, { useEffect, useState, useMemo } from "react";
import { Search, ShieldCheck, Ban, Trash2, Star, Eye, X, ShieldX, MessageSquare, Pencil, LifeBuoy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import RatingStars from "@/components/RatingStars";
import { findOrCreateOfficialChat } from "@/lib/officialChat";

export default function AdminUsers() {
  const { lang, user: adminUser } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [ratings, setRatings] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.User.list("-created_date", 500);
        setUsers(list || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let r = users;
    if (filter === "trusted") r = r.filter((u) => u.is_trusted);
    else if (filter === "banned") r = r.filter((u) => u.is_banned);
    else if (filter === "admin") r = r.filter((u) => u.role === "admin");
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((u) =>
        (u.username || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        (u.first_name || "").toLowerCase().includes(s) ||
        (u.last_name || "").toLowerCase().includes(s)
      );
    }
    return r;
  }, [users, q, filter]);

  const loadRatings = async (userId) => {
    try {
      const rs = await base44.entities.Rating.filter({ rated_user_id: userId }, "-created_date", 50);
      setRatings((prev) => ({ ...prev, [userId]: rs || [] }));
    } catch {}
  };

  const openUser = (u) => {
    setSelected(u);
    if (!ratings[u.id]) loadRatings(u.id);
  };

  const toggleTrusted = async (u) => {
    try {
      await base44.asServiceRole.entities.User.update(u.id, { is_trusted: !u.is_trusted });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_trusted: !u.is_trusted } : x)));
      if (selected?.id === u.id) setSelected({ ...u, is_trusted: !u.is_trusted });
      toast({ title: !u.is_trusted ? (ar ? "تم منح شارة الثقة" : "Trusted badge granted") : (ar ? "تم إزالة شارة الثقة" : "Trusted badge removed") });
    } catch (e) {
      toast({ title: ar ? "فشل التحديث" : "Update failed", variant: "destructive" });
    }
  };

  const toggleBan = async (u) => {
    try {
      await base44.asServiceRole.entities.User.update(u.id, { is_banned: !u.is_banned });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_banned: !u.is_banned } : x)));
      if (selected?.id === u.id) setSelected({ ...u, is_banned: !u.is_banned });
      toast({ title: !u.is_banned ? (ar ? "تم حظر المستخدم" : "User banned") : (ar ? "تم رفع الحظر" : "User unbanned") });
    } catch {
      toast({ title: ar ? "فشل التحديث" : "Update failed", variant: "destructive" });
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(ar ? `حذف ${u.username || u.email}؟ لا يمكن التراجع.` : `Delete ${u.username || u.email}? This cannot be undone.`)) return;
    try {
      await base44.asServiceRole.entities.User.delete(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      if (selected?.id === u.id) setSelected(null);
      toast({ title: ar ? "تم حذف المستخدم" : "User deleted" });
    } catch {
      toast({ title: ar ? "فشل الحذف" : "Delete failed", variant: "destructive" });
    }
  };

  const blacklistUser = async (u) => {
    const reason = window.prompt(ar ? "سبب الحظر والحظر النهائي؟" : "Reason for permanent blacklist?", ar ? "مخالفه لشروط الاستخدام" : "Terms of service violation");
    if (reason === null) return;
    try {
      await base44.entities.Blacklist.create({
        email: (u.email || "").toLowerCase(),
        phone: (u.phone || "").replace(/\D/g, ""),
        reason: reason || "—",
        original_username: u.username || u.email,
      });
      await base44.asServiceRole.entities.User.delete(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      if (selected?.id === u.id) setSelected(null);
      toast({ title: ar ? "تم حظر وحذف المستخدم نهائياً" : "User blacklisted & deleted permanently" });
    } catch {
      toast({ title: ar ? "فشل الحظر" : "Blacklist failed", variant: "destructive" });
    }
  };

  const deleteRating = async (r) => {
    if (!window.confirm(ar ? "حذف هذا التقييم؟" : "Delete this rating?")) return;
    try {
      await base44.entities.Rating.delete(r.id);
      setRatings((prev) => {
        const updated = { ...prev };
        if (updated[selected.id]) updated[selected.id] = updated[selected.id].filter((x) => x.id !== r.id);
        return updated;
      });
      toast({ title: ar ? "تم حذف التقييم" : "Rating deleted" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  const editRating = async (r, newScore) => {
    try {
      await base44.entities.Rating.update(r.id, { score: newScore });
      setRatings((prev) => {
        const updated = { ...prev };
        if (updated[selected.id]) updated[selected.id] = updated[selected.id].map((x) => (x.id === r.id ? { ...x, score: newScore } : x));
        return updated;
      });
      toast({ title: ar ? "تم تعديل التقييم" : "Rating updated" });
    } catch {
      toast({ title: ar ? "فشل" : "Failed", variant: "destructive" });
    }
  };

  const startOfficialChat = async (target, label) => {
    try {
      const roomId = await findOrCreateOfficialChat(adminUser, target, label);
      nav(`/chat/${roomId}`);
    } catch {
      toast({ title: ar ? "فشل إنشاء المحادثة" : "Failed to start chat", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "بحث بالاسم أو الإيميل…" : "Search name or email…"}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl text-sm">
          {[
            { id: "all", label: ar ? "الكل" : "All" },
            { id: "trusted", label: ar ? "موثوق" : "Trusted" },
            { id: "banned", label: ar ? "محظور" : "Banned" },
            { id: "admin", label: ar ? "أدمن" : "Admin" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${filter === f.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">{ar ? "لا يوجد مستخدمون" : "No users found"}</div>
        ) : filtered.map((u) => (
          <div key={u.id} className="rounded-2xl bg-card border border-border/60 p-3 flex items-center gap-3">
            <button onClick={() => openUser(u)} className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">{(u.first_name || u.email || "?")[0]?.toUpperCase()}</div>}
            </button>
            <button onClick={() => openUser(u)} className="flex-1 min-w-0 text-start">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate">{u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : u.email}</span>
                {u.is_trusted && <ShieldCheck size={14} className="text-cyan-500 shrink-0" />}
                {u.is_banned && <Ban size={14} className="text-rose-500 shrink-0" />}
                {u.role === "admin" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">ADMIN</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">@{u.username || "—"} · {u.email}</p>
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => toggleTrusted(u)} title={ar ? "شارة الثقة" : "Trust badge"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${u.is_trusted ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40" : "bg-muted hover:bg-muted/70"}`}>
                <ShieldCheck size={16} />
              </button>
              <button onClick={() => toggleBan(u)} title={ar ? "حظر" : "Ban"} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${u.is_banned ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40" : "bg-muted hover:bg-muted/70"}`}>
                <Ban size={16} />
              </button>
              <button onClick={() => deleteUser(u)} title={ar ? "حذف" : "Delete"} className="w-8 h-8 rounded-lg bg-muted hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-center transition">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* User detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{ar ? "تفاصيل المستخدم" : "User Details"}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0">
                {selected.avatar ? <img src={selected.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">{(selected.first_name || selected.email || "?")[0]?.toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold truncate">{selected.first_name ? `${selected.first_name} ${selected.last_name || ""}`.trim() : selected.email}</p>
                  {selected.is_trusted && <ShieldCheck size={16} className="text-cyan-500" />}
                  {selected.is_banned && <Ban size={16} className="text-rose-500" />}
                </div>
                <p className="text-sm text-muted-foreground truncate">@{selected.username || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "الهاتف" : "Phone"}</p><p className="font-semibold">{selected.country_code} {selected.phone || "—"}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "النية" : "Intent"}</p><p className="font-semibold capitalize">{selected.intent || "—"}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "الدور" : "Role"}</p><p className="font-semibold capitalize">{selected.role}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "انضم" : "Joined"}</p><p className="font-semibold">{new Date(selected.created_date).toLocaleDateString()}</p></div>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => toggleTrusted(selected)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${selected.is_trusted ? "bg-cyan-500 text-white" : "bg-muted"}`}>
                <ShieldCheck size={16} /> {selected.is_trusted ? (ar ? "إزالة الثقة" : "Remove Trust") : (ar ? "منح الثقة" : "Grant Trust")}
              </button>
              <button onClick={() => toggleBan(selected)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 ${selected.is_banned ? "bg-rose-500 text-white" : "bg-muted"}`}>
                <Ban size={16} /> {selected.is_banned ? (ar ? "رفع الحظر" : "Unban") : (ar ? "حظر" : "Ban")}
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => startOfficialChat(selected, "Management")} className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 bg-primary text-primary-foreground">
                <MessageSquare size={16} /> {ar ? "إدارة" : "Mgmt"}
              </button>
              <button onClick={() => startOfficialChat(selected, "Support")} className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 bg-amber-500 text-white">
                <LifeBuoy size={16} /> {ar ? "دعم" : "Support"}
              </button>
            </div>
            <button onClick={() => blacklistUser(selected)} className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 bg-rose-600 text-white mb-4">
              <ShieldX size={16} /> {ar ? "حظر نهائي وحذف" : "Blacklist & Delete"}
            </button>
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Star size={16} className="text-amber-500" /> {ar ? "التقييمات" : "Ratings"}</p>
              {ratings[selected.id]?.length ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ratings[selected.id].map((r) => (
                    <div key={r.id} className="rounded-xl bg-muted p-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{r.rater_name || "—"}</span>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={r.score}
                            onChange={(e) => editRating(r, Number(e.target.value))}
                            className="text-xs rounded-lg bg-card border border-border/60 px-1.5 py-0.5 outline-none"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n} ★</option>
                            ))}
                          </select>
                          <button onClick={() => deleteRating(r)} className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {r.review && <p className="text-muted-foreground mt-1">{r.review}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{ar ? "لا توجد تقييمات" : "No ratings yet"}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}