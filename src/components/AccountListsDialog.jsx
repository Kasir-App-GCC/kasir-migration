import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Ban, UserPlus, Bookmark, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

// Single dialog with three tabs for managing account lists the app already
// stores but had no UI for: blocked users (UserBlock), followed users
// (UserFollow), and saved searches (SavedSearch).
export default function AccountListsDialog({ open, onClose, initialTab = "blocked" }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState([]);
  const [following, setFollowing] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [searches, setSearches] = useState([]);
  const [busy, setBusy] = useState("");

  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.UserBlock.filter({ blocker_id: user.id }, "-created_date", 100);
      setBlocked(list || []);
    } catch {}
    setLoading(false);
  };
  const loadFollowing = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.UserFollow.filter({ follower_id: user.id }, "-created_date", 100);
      setFollowing(list || []);
      const ids = (list || []).map((f) => f.followed_id).filter(Boolean);
      if (ids.length) {
        const profs = await Promise.all(ids.map((id) => base44.functions.invoke("getPublicProfile", { user_id: id }).catch(() => null)));
        const map = {};
        ids.forEach((id, i) => { if (profs[i]?.data) map[id] = profs[i].data; });
        setProfiles(map);
      }
    } catch {}
    setLoading(false);
  };
  const loadSearches = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SavedSearch.filter({ user_id: user.id }, "-created_date", 100);
      setSearches(list || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !user) return;
    if (tab === "blocked") loadBlocked();
    else if (tab === "following") loadFollowing();
    else loadSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, user?.id]);

  const unblock = async (b) => {
    setBusy(b.id);
    try { await base44.entities.UserBlock.delete(b.id); setBlocked((p) => p.filter((x) => x.id !== b.id)); } catch {}
    setBusy("");
  };
  const unfollow = async (f) => {
    setBusy(f.id);
    try { await base44.entities.UserFollow.delete(f.id); setFollowing((p) => p.filter((x) => x.id !== f.id)); } catch {}
    setBusy("");
  };
  const deleteSearch = async (s) => {
    setBusy(s.id);
    try { await base44.entities.SavedSearch.delete(s.id); setSearches((p) => p.filter((x) => x.id !== s.id)); } catch {}
    setBusy("");
  };

  if (!open) return null;

  const tabs = [
    { id: "blocked", label: ar ? "المحظورون" : "Blocked", icon: Ban },
    { id: "following", label: ar ? "المتابَعون" : "Following", icon: UserPlus },
    { id: "searches", label: ar ? "البحوث" : "Searches", icon: Bookmark },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">{ar ? "إدارة القوائم" : "Manage lists"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-3">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 ${tab === tb.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <tb.icon size={14} /> {tb.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-8 text-center"><Loader2 size={22} className="animate-spin mx-auto text-muted-foreground" /></div>
          ) : tab === "blocked" ? (
            blocked.length ? blocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/60">
                <span className="font-semibold text-sm truncate">{b.blocked_name || b.blocked_id}</span>
                <button onClick={() => unblock(b)} disabled={busy === b.id} className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold border border-rose-200 dark:border-rose-900 disabled:opacity-50">
                  {ar ? "إلغاء الحظر" : "Unblock"}
                </button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{ar ? "لا يوجد محظورون" : "No blocked users"}</p>
          ) : tab === "following" ? (
            following.length ? following.map((f) => {
              const p = profiles[f.followed_id] || {};
              return (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/60">
                  <button onClick={() => { onClose(); nav(`/user/${f.followed_id}`); }} className="flex items-center gap-2 min-w-0 text-start">
                    <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-primary text-sm">
                      {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : (p.name || "?")[0]}
                    </div>
                    <span className="font-semibold text-sm truncate">{p.name || f.followed_id}</span>
                  </button>
                  <button onClick={() => unfollow(f)} disabled={busy === f.id} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold disabled:opacity-50">{ar ? "إلغاء المتابعة" : "Unfollow"}</button>
                </div>
              );
            }) : <p className="text-center text-sm text-muted-foreground py-8">{ar ? "لا تتابع أحداً" : "Not following anyone"}</p>
          ) : (
            searches.length ? searches.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/60">
                <span className="font-semibold text-sm truncate">{s.name || (ar ? "بحث محفوظ" : "Saved search")}</span>
                <button onClick={() => deleteSearch(s)} disabled={busy === s.id} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"><Trash2 size={15} /></button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{ar ? "لا توجد بحوث محفوظة" : "No saved searches"}</p>
          )}
        </div>
      </div>
    </div>
  );
}