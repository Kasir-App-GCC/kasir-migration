import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Returns the block relationship between the signed-in user and `otherId`:
//   blockedByMe — I blocked them (I can unblock)
//   blockedMe   — they blocked me (I can't message them)
// Plus block()/unblock() actions. Used by ChatRoom, ItemDetail, and UserProfile
// to gate messaging/buying and show a block control. Both directions are read
// so a user who was blocked sees it too (RLS allows reading rows where the
// user is either blocker or blocked).
export function useBlockStatus(otherId, meId) {
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [blockId, setBlockId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!otherId || !meId || otherId === meId) { setLoading(false); return; }
    try {
      const rows = await base44.entities.UserBlock.filter(
        { $or: [
          { blocker_id: meId, blocked_id: otherId },
          { blocker_id: otherId, blocked_id: meId },
        ] },
        "-created_date",
        10
      );
      const mine = (rows || []).find((r) => r.blocker_id === meId && r.blocked_id === otherId);
      const theirs = (rows || []).find((r) => r.blocker_id === otherId && r.blocked_id === meId);
      setBlockedByMe(!!mine);
      setBlockId(mine?.id || null);
      setBlockedMe(!!theirs);
    } catch {}
    setLoading(false);
  }, [otherId, meId]);

  useEffect(() => { load(); }, [load]);

  const block = useCallback(async (blockedName) => {
    if (!meId || !otherId) return;
    try {
      const r = await base44.entities.UserBlock.create({
        blocker_id: meId, blocked_id: otherId, blocked_name: blockedName || null,
      });
      setBlockedByMe(true);
      setBlockId(r?.id || null);
    } catch {}
  }, [meId, otherId]);

  const unblock = useCallback(async () => {
    if (!blockId) { setBlockedByMe(false); return; }
    try {
      await base44.entities.UserBlock.delete(blockId);
      setBlockedByMe(false);
      setBlockId(null);
    } catch {}
  }, [blockId]);

  return { blockedByMe, blockedMe, block, unblock, loading, reload: load };
}