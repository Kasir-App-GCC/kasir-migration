import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, ShieldCheck, Ban, Trash2, Star, Eye, X, ShieldX, Pencil, LifeBuoy, KeyRound, Save, ImagePlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import RatingStars from "@/components/RatingStars";
import { findOrCreateOfficialChat } from "@/lib/officialChat";
import SheetSelect from "@/components/SheetSelect";
import { invalidateSellerCache } from "@/lib/useTrusted";

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
  // Aggregate rating averages per user (rated_user_id -> { avg, count }),
  // computed once on load so the "low ratings" filter can surface bad sellers
  // without opening each user individually.
  const [ratingMap, setRatingMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", phone: "", country_code: "+966", avatar: "" });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef(null);

  const startEdit = (u) => {
    setEditForm({
      username: u.username || "",
      phone: u.phone || "",
      country_code: u.country_code || "+966",
      avatar: u.avatar || "",
    });
  };

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: ar ? "الصورة كبيرة جداً (حد 5MB)" : "Image too large (max 5MB)", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setAvatarUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm((f) => ({ ...f, avatar: file_url }));
      const updated = { ...selected, avatar: file_url };
      setSelected(updated);
      setUsers((prev) => prev.map((x) => (x.id === selected.id ? { ...x, avatar: file_url } : x)));
      await base44.functions.invoke("updateUser", { userId: selected.id, avatar: file_url });
      toast({ title: ar ? "تم تحديث الصورة" : "Avatar updated" });
    } catch {
      toast({ title: ar ? "فشل رفع الصورة" : "Upload failed", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke("updateUser", {
        userId: selected.id,
        username: editForm.username.trim(),
        phone: editForm.phone.replace(/\D/g, ""),
        country_code: editForm.country_code.trim(),
      });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
      const updated = { ...selected, ...editForm };
      setSelected(updated);
      setUsers((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ...editForm } : x)));
      toast({ title: ar ? "تم حفظ التعديلات" : "Profile updated" });
    } catch (e) {
      toast({ title: ar ? "فشل التحديث" : "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!selected?.email) return;
    if (!window.confirm(ar ? `إرسال رابط إعادة تعيين كلمة المرور إلى ${selected.email}؟` : `Send password reset link to ${selected.email}?`)) return;
    try {
      await base44.auth.resetPasswordRequest(selected.email);
      toast({ title: ar ? "تم إرسال رابط إعادة التعيين" : "Reset link sent" });
    } catch {
      toast({ title: ar ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [list, allRatings] = await Promise.all([
          base44.entities.User.list("-created_date", 500),
          base44.entities.Rating.list("-created_date", 500),
        ]);
        // Filter out soft-deleted (disabled) users so they don't reappear after deletion
        setUsers((list || []).filter((u) => !u.disabled));
        // Build per-user aggregate ratings to power the "low ratings" filter.
        const map = {};
        (allRatings || []).forEach((r) => {
          const uid = r.rated_user_id;
          if (!uid) return;
          if (!map[uid]) map[uid] = { sum: 0, count: 0 };
          map[uid].sum += r.score || 0;
          map[uid].count += 1;
        });
        const agg = {};
        Object.entries(map).forEach(([uid, v]) => {
          agg[uid] = { avg: v.sum / v.count, count: v.count };
        });
        setRatingMap(agg);
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
    else if (filter === "low") {
      // Sellers whose average rating is below 3.5 (with at least one rating) —
      // the ones an admin should keep an eye on as potentially bad sellers.
      r = r.filter((u) => {
        const r1 = ratingMap[u.id];
        return r1 && r1.count > 0 && r1.avg < 3.5;
      });
    }
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
    startEdit(u);
    if (!ratings[u.id]) loadRatings(u.id);
  };

  const toggleTrusted = async (u) => {
    try {
      const res = await base44.functions.invoke("updateUser", { userId: u.id, is_trusted: !u.is_trusted });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
      invalidateSellerCache(u.id);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_trusted: !u.is_trusted } : x)));
      if (selected?.id === u.id) setSelected({ ...u, is_trusted: !u.is_trusted });
      toast({ title: !u.is_trusted ? (ar ? "تم منح شارة الثقة" : "Trusted badge granted") : (ar ? "تم إزالة شارة الثقة" : "Trusted badge removed") });
    } catch (e) {
      toast({ title: ar ? "فشل التحديث" : "Update failed", variant: "destructive" });
    }
  };

  const toggleBan = async (u) => {
    try {
      const res = await base44.functions.invoke("updateUser", { userId: u.id, is_banned: !u.is_banned });
      if (!res.data?.success) throw new Error(res.data?.error || "Update failed");
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
      const res = await base44.functions.invoke("deleteUser", { userId: u.id });
      if (!res.data?.success) throw new Error(res.data?.error || "Delete failed");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      if (selected?.id === u.id) setSelected(null);
      toast({ title: ar ? "تم حذف المستخدم" : "User deleted" });
    } catch (e) {
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
      const res = await base44.functions.invoke("deleteUser", { userId: u.id });
      if (!res.data?.success) throw new Error(res.data?.error || "Delete failed");
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
            { id: "low", label: ar ? "تقييم منخفض" : "Low Ratings" },
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
                {filter === "low" && ratingMap[u.id] && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 shrink-0">
                    <Star size={10} className="fill-rose-500 text-rose-500" />
                    {ratingMap[u.id].avg.toFixed(1)} ({ratingMap[u.id].count})
                  </span>
                )}
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
              <button onClick={onPickAvatar} disabled={avatarUploading} className="relative w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0 group disabled:opacity-60">
                {selected.avatar ? <img src={selected.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">{(selected.first_name || selected.email || "?")[0]?.toUpperCase()}</div>}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {avatarUploading ? <Loader2 size={18} className="text-white animate-spin" /> : <ImagePlus size={18} className="text-white" />}
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold truncate">{selected.first_name ? `${selected.first_name} ${selected.last_name || ""}`.trim() : selected.email}</p>
                  {selected.is_trusted && <ShieldCheck size={16} className="text-cyan-500" />}
                  {selected.is_banned && <Ban size={16} className="text-rose-500" />}
                </div>
                <button
                  onClick={() => nav(`/user/${selected.id}?name=${encodeURIComponent(`${selected.first_name || ""} ${selected.last_name || ""}`.trim())}&avatar=${encodeURIComponent(selected.avatar || "")}`)}
                  className="text-sm text-muted-foreground truncate hover:text-primary hover:underline text-start w-full"
                  title={ar ? "عرض الملف الشخصي" : "View profile"}
                >
                  @{selected.username || "—"}
                </button>
                <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "النية" : "Intent"}</p><p className="font-semibold capitalize">{selected.intent || "—"}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "الدور" : "Role"}</p><p className="font-semibold capitalize">{selected.role}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "انضم" : "Joined"}</p><p className="font-semibold">{new Date(selected.created_date).toLocaleDateString()}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><p className="text-xs text-muted-foreground">{ar ? "البريد" : "Email"}</p><p className="font-semibold truncate" title={selected.email}>{selected.email}</p></div>
              {(selected.provider_name || selected.full_name) && (
                <div className="rounded-xl bg-muted p-2.5 col-span-2"><p className="text-xs text-muted-foreground">{ar ? "الاسم لدى Google/Apple" : "Login name (Google/Apple)"}</p><p className="font-semibold truncate" title={selected.provider_name || selected.full_name}>{selected.provider_name || selected.full_name}</p></div>
              )}
            </div>

            {/* Editable profile fields */}
            <div className="rounded-2xl border border-border/60 p-3 mb-3 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Pencil size={12} /> {ar ? "تعديل الحساب" : "Edit Account"}</p>
              <div>
                <label className="text-xs text-muted-foreground">{ar ? "اسم المستخدم" : "Username"}</label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value.slice(0, 15) }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
                  placeholder="@username"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{ar ? "رمز" : "Code"}</label>
                  <input
                    value={editForm.country_code}
                    onChange={(e) => setEditForm((f) => ({ ...f, country_code: e.target.value }))}
                    className="w-full mt-1 px-2 py-2 rounded-lg bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
                    placeholder="+966"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">{ar ? "الهاتف" : "Phone"}</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
                    placeholder="5xxxxxxxx"
                  />
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Save size={15} /> {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
              </button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {ar
                  ? "ملاحظة: البريد الإلكتروني لا يمكن تغييره. لإنهاء الجلسة أو تغيير كلمة المرور، استخدم الأزرار أدناه."
                  : "Note: Email cannot be changed. To end a session or change password, use the buttons below."}
              </p>
            </div>

            <div className="flex gap-2 mb-3">
              <button onClick={sendPasswordReset} className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <KeyRound size={16} /> {ar ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </button>
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
              <button onClick={() => startOfficialChat(selected, "Support")} className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 bg-amber-500 text-white">
                <LifeBuoy size={16} /> {ar ? "محادثة دعم" : "Support Chat"}
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
                          <SheetSelect
                            value={String(r.score)}
                            onChange={(v) => editRating(r, Number(v))}
                            buttonClassName="text-xs px-2 py-1 font-semibold w-auto min-w-[3.5rem] rounded-lg bg-card border border-border/60"
                            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} ★` }))}
                          />
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