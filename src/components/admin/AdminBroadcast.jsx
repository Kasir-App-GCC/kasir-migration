import React, { useState } from "react";
import { Send, Search, X, Users, User as UserIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import UserSearchDropdown from "@/components/UserSearchDropdown";

export default function AdminBroadcast() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [mode, setMode] = useState("all");
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: ar ? "أدخل العنوان والنص" : "Enter title and body", variant: "destructive" });
      return;
    }
    if (mode === "user" && !recipient) {
      toast({ title: ar ? "اختر مستلم" : "Select a recipient", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendAdminNotification", {
        target: mode,
        user_id: mode === "user" ? recipient.id : null,
        title: title.trim(),
        body: body.trim(),
      });
      const count = res?.data?.sent ?? res?.sent ?? 0;
      toast({ title: ar ? `تم الإرسال إلى ${count} مستخدم` : `Sent to ${count} user(s)` });
      setTitle(""); setBody(""); setRecipient(null); setQuery("");
    } catch (e) {
      toast({ title: ar ? "فشل الإرسال" : "Failed to send", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold mb-2">{ar ? "المستلمون" : "Recipients"}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("all")} className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition ${mode === "all" ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}>
              <Users size={16} /> {ar ? "كل المستخدمين" : "All users"}
            </button>
            <button onClick={() => setMode("user")} className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition ${mode === "user" ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}>
              <UserIcon size={16} /> {ar ? "مستخدم محدد" : "Specific user"}
            </button>
          </div>
        </div>

        {mode === "user" && (
          <div className="space-y-1">
            <label className="text-sm font-semibold">{ar ? "البحث عن مستخدم" : "Search user"}</label>
            {recipient ? (
              <div className="flex items-center justify-between bg-muted rounded-2xl px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold shrink-0">
                    {recipient.avatar ? <img src={recipient.avatar} className="w-full h-full object-cover" /> : (recipient.full_name?.[0] || "?")}
                  </div>
                  <span className="text-sm font-semibold truncate">{recipient.full_name}</span>
                </div>
                <button onClick={() => { setRecipient(null); setQuery(""); }} className="p-1 rounded-full hover:bg-background"><X size={16} /></button>
              </div>
            ) : (
              <div className="relative">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ar ? "اسم أو @username" : "Name or @username"} className="w-full rounded-2xl bg-muted border border-border/60 px-4 py-3 text-sm outline-none" />
                <Search size={16} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground" />
                <UserSearchDropdown query={query} onPick={(u) => { setRecipient(u); setQuery(""); }} lang={lang} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold">{ar ? "العنوان" : "Title"}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder={ar ? "عنوان الإشعار" : "Notification title"} className="w-full rounded-2xl bg-muted border border-border/60 px-4 py-3 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">{ar ? "النص" : "Body"}</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={4} placeholder={ar ? "نص الإشعار" : "Notification body"} className="w-full rounded-2xl bg-muted border border-border/60 px-4 py-3 text-sm outline-none resize-none" />
        </div>

        <button onClick={send} disabled={sending} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60">
          <Send size={16} /> {sending ? (ar ? "جاري الإرسال…" : "Sending…") : (ar ? "إرسال" : "Send")}
        </button>
        <p className="text-xs text-muted-foreground">{ar ? "يصل الإشعار داخل التطبيق وكإشعار دفع على iPhone." : "Delivered in-app and as a push notification on iPhone."}</p>
      </div>
    </div>
  );
}