import React, { useEffect, useState, useMemo } from "react";
import { Search, MessageSquare, ShieldCheck, LifeBuoy, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { findOrCreateOfficialChat } from "@/lib/officialChat";

export default function AdminMessages() {
  const { lang, user } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.User.list("-created_date", 500);
        setUsers((list || []).filter((u) => u.id !== user.id));
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.trim().toLowerCase();
    return users.filter((u) =>
      (u.username || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.first_name || "").toLowerCase().includes(s) ||
      (u.last_name || "").toLowerCase().includes(s)
    );
  }, [users, q]);

  const startChat = async (target, label) => {
    setStarting(target.id + label);
    try {
      const roomId = await findOrCreateOfficialChat(user, target, label);
      nav(`/chat/${roomId}`);
    } catch (e) {
      toast({ title: ar ? "فشل إنشاء المحادثة" : "Failed to start chat", variant: "destructive" });
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? "ابحث بالاسم أو الإيميل…" : "Search by name or email…"}
          className="w-full ps-9 pe-4 py-3 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
        />
      </div>

      {!q.trim() && (
        <div className="text-center py-10 text-muted-foreground">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">{ar ? "ابحث عن مستخدم لبدء محادثة" : "Search for a user to start a chat"}</p>
        </div>
      )}

      {q.trim() && filtered.length === 0 && !loading && (
        <div className="text-center py-10 text-muted-foreground text-sm">{ar ? "لا يوجد مستخدمون" : "No users found"}</div>
      )}

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="rounded-2xl bg-card border border-border/60 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">{(u.first_name || u.email || "?")[0]?.toUpperCase()}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : u.email}</p>
              <p className="text-xs text-muted-foreground truncate">@{u.username || "—"} · {u.email}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => startChat(u, "Management")}
                disabled={starting === u.id + "Management"}
                title={ar ? "محادثة كإدارة" : "Message as Management"}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <ShieldCheck size={14} /> {ar ? "إدارة" : "Mgmt"}
              </button>
              <button
                onClick={() => startChat(u, "Support")}
                disabled={starting === u.id + "Support"}
                title={ar ? "محادثة كدعم" : "Message as Support"}
                className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <LifeBuoy size={14} /> {ar ? "دعم" : "Support"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}