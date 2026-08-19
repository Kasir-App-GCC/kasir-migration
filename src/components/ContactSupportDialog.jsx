import React, { useEffect, useRef, useState } from "react";
import { X, Send, LifeBuoy, CheckCircle2, Hash, Mail, Paperclip } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { COUNTRIES, getCountry } from "@/lib/countries";
import SheetSelect from "@/components/SheetSelect";

// Convert Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits to ASCII 0-9
function normalizeDigits(s) {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    const n = code - 0x0660 < 10 ? code - 0x0660 : code - 0x06f0;
    return String(n);
  });
}

const MIN_PHONE = 8;
const MAX_PHONE = 12;
const MAX_ATTACH_TOTAL = 10 * 1024 * 1024; // 10 MB total across all attachments

const CATEGORIES = [
  { id: "general", en: "General question", ar: "استفسار عام" },
  { id: "technical", en: "Technical issue", ar: "مشكلة تقنية" },
  { id: "report", en: "Report a user or listing", ar: "إبلاغ عن مستخدم أو إعلان" },
  { id: "billing", en: "Billing or payments", ar: "المدفوعات" },
  { id: "other", en: "Other", ar: "أخرى" },
];

export default function ContactSupportDialog({ open, onClose }) {
  const { user, lang, country } = useStore();
  const t = useT();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phoneCode, setPhoneCode] = useState("966");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTicketNumber(null);
      setSubject("");
      setMessage("");
      setCategory("general");
      setFullName(user?.name || "");
      setEmail(user?.email || "");
      setPhone("");
      setFiles([]);
      const c = getCountry(country || "SA");
      setPhoneCode(c?.phoneCode || "966");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!fullName.trim() || !phoneValid || !email.trim() || !subject.trim() || !message.trim() || submitting) return;
    if (filesTotal > MAX_ATTACH_TOTAL) return;
    setSubmitting(true);
    try {
      let attachments = [];
      if (files.length > 0) {
        const uploaded = await Promise.all(
          files.map(async (f) => {
            const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
            return file_url;
          })
        );
        attachments = uploaded.filter(Boolean);
      }
      const res = await base44.functions.invoke("submitSupportTicket", {
        fullName: fullName.trim(),
        phone: `+${phoneCode} ${phone}`,
        email: email.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        attachments,
      });
      const num = res?.data?.ticketNumber;
      setTicketNumber(num || null);
      setSubject("");
      setMessage("");
      setCategory("general");
      setPhone("");
      setFiles([]);
    } catch (e) {
      toast({
        title: lang === "ar" ? "تعذّر إرسال التذكرة" : "Couldn't submit ticket",
        description: lang === "ar" ? "جرّب مرة أخرى لاحقاً" : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const digitsOnly = (s) => normalizeDigits(s).replace(/\D/g, "");
  const onPhoneChange = (e) => setPhone(digitsOnly(e.target.value).slice(0, MAX_PHONE));
  const phoneLen = digitsOnly(phone).length;
  const phoneValid = phoneLen >= MIN_PHONE && phoneLen <= MAX_PHONE;
  const filesTotal = files.reduce((s, f) => s + f.size, 0);
  const valid = fullName.trim() && phoneValid && email.trim() && subject.trim() && message.trim() && filesTotal <= MAX_ATTACH_TOTAL;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <LifeBuoy size={20} className="text-primary" />
            {t("contactSupport")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{t("supportFormDesc")}</p>

        {ticketNumber && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{t("ticketSubmitted")}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 mt-1">
                  <Hash size={14} /> {ticketNumber}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">{t("ticketEmailSent")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportFullName")}</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value.slice(0, 80))}
              maxLength={80}
              placeholder={t("supportFullNamePlaceholder")}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportPhone")}</label>
            <div className="flex gap-2">
              <div className="shrink-0">
                <SheetSelect
                  value={phoneCode}
                  onChange={setPhoneCode}
                  label={t("supportPhone")}
                  buttonClassName="px-3 py-3 text-sm font-semibold"
                  options={COUNTRIES.map((c) => ({ value: c.phoneCode, label: `${c.flag} +${c.phoneCode}` }))}
                />
              </div>
              <input
                value={phone}
                onChange={onPhoneChange}
                maxLength={MAX_PHONE}
                placeholder="5X XXX XXXX"
                inputMode="tel"
                className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
              />
            </div>
            <p className={`text-[11px] mt-1 ps-1 ${phone && !phoneValid ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
              {phone && !phoneValid
                ? (lang === "ar" ? `الرقم يجب أن يكون بين ${MIN_PHONE} و ${MAX_PHONE} أرقام` : `Must be ${MIN_PHONE}–${MAX_PHONE} digits`)
                : (lang === "ar" ? `بدون مفتاح الدولة — بين ${MIN_PHONE} و ${MAX_PHONE} أرقام` : `Without country code — ${MIN_PHONE}–${MAX_PHONE} digits`)}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportEmail")}</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/70 border border-border/50">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <input
                value={email}
                disabled
                readOnly
                className="bg-transparent outline-none flex-1 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 ps-1">{t("supportEmailHint")}</p>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportCategory")}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition ${category === c.id ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}
                >
                  {lang === "ar" ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportSubject")}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder={t("supportSubjectPlaceholder")}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{t("supportMessage")}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              maxLength={1000}
              rows={4}
              placeholder={t("supportMessagePlaceholder")}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none"
            />
            <div className="flex justify-end text-[11px] text-muted-foreground mt-1">{(message || "").length}/1000</div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">{lang === "ar" ? "المرفقات" : "Attachments"}</label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...picked]);
                e.target.value = "";
              }}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.zip"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 rounded-2xl bg-muted outline-none border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2"
            >
              <Paperclip size={16} /> {lang === "ar" ? "إضافة مرفقات (حد أقصى ١٠ ميجابايت)" : "Add attachments (10MB max)"}
            </button>
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted text-xs">
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-rose-500 shrink-0"><X size={14} /></button>
                  </div>
                ))}
                <p className={`text-[11px] ${filesTotal > MAX_ATTACH_TOTAL ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
                  {lang === "ar" ? `الإجمالي: ${(filesTotal / 1024 / 1024).toFixed(1)} / 10 ميجابايت` : `Total: ${(filesTotal / 1024 / 1024).toFixed(1)} / 10 MB`}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={!valid || submitting}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send size={18} className="rtl:rotate-180" /> {t("submitTicket")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}