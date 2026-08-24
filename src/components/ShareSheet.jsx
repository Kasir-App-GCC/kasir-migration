import { X, Copy, Send, Share2 } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useToast } from "@/components/ui/use-toast";

export default function ShareSheet({ open, onClose, url, title, lang }) {
  const { toast } = useToast();
  const ar = lang === "ar";
  if (!open) return null;
  const enc = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const waText = encodeURIComponent(`${title} ${url}`);
  const targets = [
    { label: "WhatsApp", color: "bg-emerald-500", href: `https://wa.me/?text=${waText}`, Icon: WhatsAppIcon },
    { label: "Telegram", color: "bg-sky-500", href: `https://t.me/share/url?url=${enc}&text=${text}`, Icon: Send },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: ar ? "تم نسخ الرابط" : "Link copied" });
      onClose();
    } catch {
      toast({ title: ar ? "تعذّر النسخ" : "Couldn't copy", variant: "destructive" });
    }
  };
  const native = async () => {
    try {
      await navigator.share({ title, text: title, url });
      onClose();
    } catch (err) {
      if (err?.name !== "AbortError") toast({ title: ar ? "تعذّر المشاركة" : "Couldn't share", variant: "destructive" });
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{ar ? "مشاركة الإعلان" : "Share listing"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {targets.map((t) => (
            <a key={t.label} href={t.href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 rounded-2xl ${t.color} text-white flex items-center justify-center`}>
                <t.Icon size={24} />
              </div>
              <span className="text-xs font-medium">{t.label}</span>
            </a>
          ))}
          <button onClick={copy} className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
              <Copy size={24} />
            </div>
            <span className="text-xs font-medium">{ar ? "نسخ الرابط" : "Copy link"}</span>
          </button>
        </div>
        {navigator.share && (
          <button onClick={native} className="mt-4 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
            <Share2 size={18} /> {ar ? "مشاركة عبر الجهاز" : "More options"}
          </button>
        )}
      </div>
    </div>
  );
}