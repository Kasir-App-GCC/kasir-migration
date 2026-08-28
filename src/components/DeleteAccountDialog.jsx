import React, { useState, useEffect } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

// Pool of innocuous sentences — one is picked at random each time the dialog
// opens, and the user must retype it to enable the delete button. This keeps
// the action deliberate without framing it as a "human verification" check.
const SENTENCES = {
  en: [
    "the calm river flows north",
    "blue birds sing at dawn",
    "soft rain falls on green leaves",
    "the old bridge stands still",
    "warm sand meets the cool tide",
    "a quiet path winds through trees",
    "golden light fills the open room",
  ],
  ar: [
    "النهر الهادئ يجري شمالاً",
    "الطيور الزرقاء تغني عند الفجر",
    "مطر لطيف يسقط على الأوراق الخضراء",
    "الجسر القديم يقف ثابتاً",
    "الرمل الدافئ يلتقي بالمد البارد",
    "ممر هادئ يتعرج بين الأشجار",
    "ضوء ذهبي يملأ الغرفة المفتوحة",
  ],
};

export default function DeleteAccountDialog({ open, onClose, onConfirm, loading }) {
  const { lang } = useStore();
  const ar = lang === "ar";
  const [sentence, setSentence] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) return;
    const pool = ar ? SENTENCES.ar : SENTENCES.en;
    setSentence(pool[Math.floor(Math.random() * pool.length)]);
    setInput("");
  }, [open, ar]);

  const matches = input.trim().length > 0 && input.trim().toLowerCase() === sentence.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Trash2 size={18} /> {ar ? "حذف الحساب" : "Delete account"}
          </DialogTitle>
          <DialogDescription>
            {ar ? "سيتم حذف حسابك وجميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء." : "Your account and all your data will be permanently removed. This cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {ar ? "اكتب الجملة التالية في الحقل لتأكيد الحذف:" : "Type the following sentence in the field to confirm deletion:"}
          </p>
          <div className="rounded-xl bg-muted p-3 text-center font-semibold text-sm selectable">
            {sentence}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/40"
            placeholder={ar ? "اكتب الجملة هنا" : "Type the sentence here"}
          />
          <button
            onClick={onConfirm}
            disabled={!matches || loading}
            className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? (ar ? "جارٍ الحذف…" : "Deleting…") : (ar ? "حذف الحساب نهائياً" : "Delete my account")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}