import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

// Manage saved searches from the seller tools: list, delete, and re-apply.
// Applying sets the shared store filters (categories, subcategories, location)
// and navigates to /search with the remaining local fields passed via router
// state, which the Search page reads on mount.
export default function SavedSearchesDialog({ open, onClose }) {
  const { user, lang, setCategories, setSubcategories, setLocationFilter, locationFilter } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    base44.entities.SavedSearch.filter({ user_id: user.id }, "-created_date", 50)
      .then((list) => setSearches(list || []))
      .catch(() => setSearches([]))
      .finally(() => setLoading(false));
  }, [open, user, tick]);

  const del = async (id) => {
    try { await base44.entities.SavedSearch.delete(id); } catch {}
    setTick((x) => x + 1);
  };

  const apply = (s) => {
    setCategories(s.category && s.category !== "all" ? [s.category] : []);
    setSubcategories(Array.isArray(s.subcategory) ? s.subcategory : []);
    if (s.city) setLocationFilter({ mode: "city", city: s.city, radius: locationFilter.radius || 25 });
    onClose?.();
    nav("/search", { state: { savedSearch: { q: s.query || "", minPrice: s.price_min ? String(s.price_min) : "", maxPrice: s.price_max ? String(s.price_max) : "", condition: s.condition || "" } } });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark size={20} className="text-primary" />
            {ar ? "عمليات البحث المحفوظة" : "Saved searches"}
          </DialogTitle>
          <DialogDescription>
            {ar ? "أعد تطبيق بحث محفوظ أو احذفه." : "Re-run a saved search or delete it."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : searches.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Bookmark size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold">{ar ? "لا توجد عمليات بحث محفوظة" : "No saved searches"}</p>
            <p className="text-xs mt-1">{ar ? "احفظ بحثاً من صفحة البحث لتظهر هنا." : "Save a search from the search page to see it here."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {searches.map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-3 rounded-2xl border border-border/60">
                <button onClick={() => apply(s)} className="flex-1 flex items-center gap-2.5 min-w-0 text-start hover:bg-muted/50 -mx-1 px-1 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Search size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{s.name || (ar ? "بحث محفوظ" : "Saved search")}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{ar ? "اضغط للتطبيق" : "Tap to apply"}</p>
                  </div>
                </button>
                <button onClick={() => del(s.id)} className="shrink-0 p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition" aria-label={ar ? "حذف" : "Delete"}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}