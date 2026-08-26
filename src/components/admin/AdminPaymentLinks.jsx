import React, { useState } from "react";
import { Link2, Loader2, Copy, Plus, X, UserCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import UserSearchDropdown from "@/components/UserSearchDropdown";

export default function AdminPaymentLinks() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);

  const create = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast({ title: ar ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createPaymentLink", {
        amount: amt,
        description: description.trim(),
        user_id: selectedUser?.id || "",
        origin: window.location.origin,
      });
      if (res?.data?.ok) {
        setLinks((prev) => [{ ...res.data, user: selectedUser, created: Date.now() }, ...prev]);
        setAmount("");
        setDescription("");
        setSelectedUser(null);
        setUserQuery("");
        toast({ title: ar ? "تم إنشاء الرابط" : "Link created" });
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      toast({ title: ar ? "فشل إنشاء الرابط" : "Failed to create link", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: ar ? "تم نسخ الرابط" : "Link copied" });
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-3 text-xs text-sky-700 dark:text-sky-300">
        {ar
          ? "أنشئ رابط دفع عبر Moyasar وأرسله للمستخدم ليدفع بالبطاقة أو Apple Pay. يفتح صفحة دفع جاهزة بالمبلغ المحدد."
          : "Generate a Moyasar payment link and send it to the user to pay by card or Apple Pay. Opens a hosted checkout page with the set amount."}
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
        <div>
          <label className="text-sm font-semibold">{ar ? "المبلغ (ريال سعودي)" : "Amount (SAR)"}</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50.00"
            dir="ltr"
            inputMode="decimal"
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">{ar ? "الوصف" : "Description"}</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={ar ? "مثال: رسوم تعزيز الإعلان" : "e.g. Boost listing fee"}
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
          />
        </div>
        <div className="relative">
          <label className="text-sm font-semibold">{ar ? "إسناد لمستخدم (اختياري)" : "Attribute to user (optional)"}</label>
          {selectedUser ? (
            <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-muted">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : (selectedUser.full_name?.[0] || "?")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{selectedUser.full_name || "—"}</p>
                {selectedUser.username && <p className="text-xs text-muted-foreground truncate">@{selectedUser.username}</p>}
              </div>
              <button onClick={() => { setSelectedUser(null); setUserQuery(""); }} className="p-1 rounded-full hover:bg-background">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={ar ? "ابحث بالاسم أو @المعرف لربط الدفع بمستخدم" : "Search by name or @username to attribute payment"}
                className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
              />
              <UserSearchDropdown query={userQuery} onPick={(u) => { setSelectedUser(u); setUserQuery(""); }} lang={lang} />
            </>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">
            {ar ? "يُسجّل الدفع باسم هذا المستخدم في لوحة المدفوعات بدل \"زائر\"." : "The synced payment will show this user in the ledger instead of \"Guest\"."}
          </p>
        </div>
        <button
          onClick={create}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {ar ? "إنشاء رابط الدفع" : "Create payment link"}
        </button>
      </div>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.invoiceId} className="rounded-2xl bg-card border border-border/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{l.amount} SAR</span>
                <span className="text-xs text-muted-foreground truncate max-w-[60%]">{l.description || "—"}</span>
              </div>
              {l.user && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCircle size={13} className="text-primary" />
                  <span className="truncate">{l.user.full_name || l.user.username || (ar ? "زائر" : "Guest")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate text-xs font-mono bg-muted px-2 py-2 rounded-lg" dir="ltr">{l.url}</div>
                <button onClick={() => copy(l.url)} className="px-2.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs flex items-center gap-1 shrink-0">
                  <Copy size={14} /> {ar ? "نسخ" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}