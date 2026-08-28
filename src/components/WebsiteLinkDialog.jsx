import React, { useEffect, useState } from "react";
import { Globe, Loader2, Send, CheckCircle2, Link2, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import Price from "@/components/Price";

// Self-service dialog: the seller picks one of their listings and adds (or
// removes) a link to their own website/store for that item. The link is shown
// as a banner on the item's detail page.
export default function WebsiteLinkDialog({ open, onClose }) {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSelectedId("");
    setUrl("");
    base44.entities.Item.filter({ seller_id: user.id }, "-created_date", 200)
      .then((list) => setListings(list || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  const selectedItem = listings.find((x) => x.id === selectedId) || null;

  // Prefill the URL field when the seller picks an item that already has a link.
  useEffect(() => {
    setUrl(selectedItem?.website_url || "");
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeUrl = (raw) => {
    const v = (raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return "https://" + v;
  };

  const isValidUrl = (v) => {
    if (!v) return false;
    try {
      const u = new URL(normalizeUrl(v));
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const save = async () => {
    if (!selectedItem || saving) return;
    const trimmed = url.trim();
    if (trimmed && !isValidUrl(trimmed)) {
      toast({ title: ar ? "الرابط غير صحيح" : "Invalid link", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = trimmed ? { website_url: normalizeUrl(trimmed) } : { website_url: "" };
      await base44.entities.Item.update(selectedItem.id, payload);
      setListings((prev) => prev.map((it) => (it.id === selectedItem.id ? { ...it, ...payload } : it)));
      toast({
        title: trimmed
          ? (ar ? "تم حفظ رابط الموقع ✅" : "Website link saved ✅")
          : (ar ? "تمت إزالة الرابط" : "Link removed"),
      });
      if (!trimmed) setUrl("");
    } catch {
      toast({ title: ar ? "تعذّر الحفظ" : "Couldn't save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe size={20} className="text-sky-500" />
            {ar ? "أضف رابط موقعك" : "Add your website"}
          </DialogTitle>
          <DialogDescription>
            {ar
              ? "اربط إعلانك بصفحتك أو متجرك الإلكتروني ليظهر للمشترين كرابط مباشر."
              : "Link your listing to your own website or store — buyers will see it as a direct link."}
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-sm font-semibold mb-2">{ar ? "اختر إعلانك" : "Choose your listing"}</p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {ar ? "لا توجد إعلانات. أنشئ إعلان أولاً." : "No listings yet. Create a listing first."}
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1.5 pe-1">
              {listings.map((it) => {
                const isSelected = it.id === selectedId;
                const hasLink = !!it.website_url;
                return (
                  <button
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-start transition ${isSelected ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30" : "border-border/60 hover:bg-muted/50"}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {it.images?.[0] ? <img src={it.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Globe size={16} className="text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{it.title}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Price value={it.price} lang={lang} country={it.country} />
                        {hasLink && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                            <Link2 size={9} /> {ar ? "مرتبط" : "Linked"}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center shrink-0"><CheckCircle2 size={12} className="text-white" /></div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-1.5">
              <Link2 size={14} /> {ar ? "رابط الموقع" : "Website link"}
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value.slice(0, 300))}
                placeholder={ar ? "مثال: my-store.com/product" : "e.g. my-store.com/product"}
                dir="ltr"
                className="bg-transparent outline-none flex-1 text-start"
                inputMode="url"
              />
              {url && (
                <a
                  href={normalizeUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary shrink-0"
                  title={ar ? "فتح" : "Open"}
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {ar
                ? "اتركه فارغاً واحفظ لإزالة الرابط من هذا الإعلان."
                : "Leave empty and save to remove the link from this listing."}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {selectedItem?.website_url && url && (
            <button
              onClick={() => setUrl("")}
              disabled={saving}
              className="px-3 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={16} /> {ar ? "إزالة" : "Remove"}
            </button>
          )}
          <button
            onClick={save}
            disabled={!selectedId || saving}
            className="flex-1 px-5 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}