import React from "react";
import { X, CheckSquare, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";

// A sticky bar shown when the user is in "select mode" for bulk-deleting
// listings. Renders the count of selected items and a delete action.
export default function BulkSelectBar({ selectedCount, onSelectAll, onDelete, onExit, total }) {
  const t = useT();
  if (selectedCount === 0 && total === 0) return null;

  return (
    <div className="sticky top-0 z-30 -mx-1 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
      <button onClick={onExit} className="p-1 rounded-full hover:bg-white/15">
        <X size={18} />
      </button>
      <span className="text-sm font-bold flex-1">
        {selectedCount} {t("selectedCount")}
      </span>
      <button
        onClick={onSelectAll}
        className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition"
      >
        <CheckSquare size={14} /> {t("selectAll")}
      </button>
      <button
        onClick={onDelete}
        disabled={selectedCount === 0}
        className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 transition"
      >
        <Trash2 size={14} /> {t("deleteSelected")}
      </button>
    </div>
  );
}