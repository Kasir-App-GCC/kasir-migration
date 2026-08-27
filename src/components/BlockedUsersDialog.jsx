import React, { useState, useEffect } from "react";
import { Ban, X, UserX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function BlockedUsersDialog({ open, onClose }) {
  const t = useT();
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    let alive = true;
    setLoading(true);
    base44.entities.UserBlock.filter({ blocker_id: user.id }, "-created_date", 100)
      .then((list) => { if (alive) setBlocks(list || []); })
      .catch(() => { if (alive) setBlocks([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, user]);

  const unblock = async (block) => {
    try {
      await base44.entities.UserBlock.delete(block.id);
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    } catch {}
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[80vh] flex flex-col bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2"><Ban size={20} /> {ar ? "المستخدمون المحظورون" : "Blocked users"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UserX size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold">{ar ? "لا يوجد مستخدمون محظورون" : "No blocked users"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <span className="font-semibold text-sm truncate">{b.blocked_name || "—"}</span>
                  <button onClick={() => unblock(b)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {t("unblockUser")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}