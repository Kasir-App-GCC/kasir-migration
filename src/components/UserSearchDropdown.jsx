import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function UserSearchDropdown({ query, onPick, lang }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim().replace(/^@/, "");
    if (q.length < 1) { setUsers([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("searchUsers", { query: q });
        setUsers(res?.data?.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  if (!query.trim() || (users.length === 0 && !loading)) return null;

  return (
    <div className="absolute top-full mt-1 inset-x-0 z-30 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
      {loading && users.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground">{lang === "ar" ? "بحث…" : "Searching…"}</div>
      ) : (
        users.map((u) => (
          <button
            key={u.id}
            onMouseDown={(e) => { e.preventDefault(); onPick(u); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-muted transition border-b border-border/40 last:border-0"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.full_name?.[0] || "?")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{u.full_name || "—"}</p>
              {u.username && <p className="text-xs text-muted-foreground truncate">@{u.username}</p>}
            </div>
          </button>
        ))
      )}
    </div>
  );
}