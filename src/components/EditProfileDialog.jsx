import React, { useState } from "react";
import { X, Camera, Loader2, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { syncAvatarToEntities } from "@/lib/syncAvatar";
import { getCountry } from "@/lib/countries";

const COUNTRY_CODES = [
  { code: "966", flag: "🇸🇦", en: "Saudi Arabia", ar: "السعودية" },
  { code: "971", flag: "🇦🇪", en: "UAE", ar: "الإمارات" },
  { code: "965", flag: "🇰🇼", en: "Kuwait", ar: "الكويت" },
  { code: "974", flag: "🇶🇦", en: "Qatar", ar: "قطر" },
  { code: "973", flag: "🇧🇭", en: "Bahrain", ar: "البحرين" },
  { code: "968", flag: "🇴🇲", en: "Oman", ar: "عُمان" },
  { code: "967", flag: "🇾🇪", en: "Yemen", ar: "اليمن" },
  { code: "962", flag: "🇯🇴", en: "Jordan", ar: "الأردن" },
  { code: "964", flag: "🇮🇶", en: "Iraq", ar: "العراق" },
  { code: "961", flag: "🇱🇧", en: "Lebanon", ar: "لبنان" },
  { code: "963", flag: "🇸🇾", en: "Syria", ar: "سوريا" },
  { code: "970", flag: "🇵🇸", en: "Palestine", ar: "فلسطين" },
  { code: "20", flag: "🇪🇬", en: "Egypt", ar: "مصر" },
  { code: "249", flag: "🇸🇩", en: "Sudan", ar: "السودان" },
  { code: "218", flag: "🇱🇾", en: "Libya", ar: "ليبيا" },
  { code: "212", flag: "🇲🇦", en: "Morocco", ar: "المغرب" },
  { code: "213", flag: "🇩🇿", en: "Algeria", ar: "الجزائر" },
  { code: "216", flag: "🇹🇳", en: "Tunisia", ar: "تونس" },
  { code: "90", flag: "🇹🇷", en: "Turkey", ar: "تركيا" },
  { code: "91", flag: "🇮🇳", en: "India", ar: "الهند" },
  { code: "92", flag: "🇵🇰", en: "Pakistan", ar: "باكستان" },
  { code: "1", flag: "🇺🇸", en: "USA", ar: "أمريكا" },
  { code: "44", flag: "🇬🇧", en: "UK", ar: "بريطانيا" },
  { code: "49", flag: "🇩🇪", en: "Germany", ar: "ألمانيا" },
  { code: "33", flag: "🇫🇷", en: "France", ar: "فرنسا" },
];

function parseWaNumber(existing, defaultCode = "966") {
  const matched = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length).find((c) => existing.startsWith(c.code));
  if (matched) return { country: matched.code, number: existing.slice(matched.code.length) };
  return { country: defaultCode, number: existing };
}

export default function EditProfileDialog({ open, onClose }) {
  const { user, checkUserAuth } = useAuth();
  const { lang } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [waEnabled, setWaEnabled] = useState(!!user?.whatsapp_enabled);
  const initialWa = parseWaNumber((user?.whatsapp_number || "").replace(/\D/g, ""), getCountry(user?.country)?.phoneCode || "966");
  const [waCountry, setWaCountry] = useState(initialWa.country);
  const [waNumber, setWaNumber] = useState(initialWa.number);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatar(file_url);
    } catch {
      setError(ar ? "فشل رفع الصورة" : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const cleanUsername = (v) => v.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const submit = async () => {
    setError("");
    if (!firstName.trim()) {
      setError(ar ? "اكتب اسمك الأول" : "Please enter your first name");
      return;
    }
    const uname = cleanUsername(username);
    if (uname.length < 3) {
      setError(ar ? "اسم المستخدم لا يقل عن 3 أحرف" : "Username must be at least 3 characters");
      return;
    }
    setSaving(true);
    try {
      const localDigits = waNumber.replace(/\D/g, "");
      if (waEnabled && localDigits.length < 6) {
        setError(ar ? "أدخل رقم واتساب صحيح" : "Enter a valid WhatsApp number");
        setSaving(false);
        return;
      }
      const fullWa = waCountry + localDigits;
      await base44.auth.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: uname,
        avatar,
        whatsapp_enabled: waEnabled,
        whatsapp_number: waEnabled && localDigits ? fullWa : (user?.whatsapp_number || ""),
      });
      await checkUserAuth();
      await syncAvatarToEntities(user.id, avatar);
      onClose();
    } catch (err) {
      setError(err.message || (ar ? "فشل الحفظ" : "Failed to save"));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t("editProfile")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="flex flex-col items-center mb-4">
          <label className="relative cursor-pointer">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-muted-foreground" />}
              {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
            </div>
            <div className="absolute -bottom-1 end-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"><Camera size={16} /></div>
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>
          <p className="text-xs text-muted-foreground mt-3">{t("changePhoto")}</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t("firstName")} *</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t("lastName")}</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{t("username")} *</label>
            <div className="flex items-center px-4 py-3 rounded-2xl bg-muted">
              <span className="text-muted-foreground me-1">@</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("usernamePlaceholder")} className="bg-transparent outline-none flex-1 lowercase" />
            </div>
            <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <label className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold">{ar ? "السماح بالتواصل عبر واتساب" : "Allow WhatsApp contact"}</span>
              <button
                type="button"
                onClick={() => setWaEnabled((v) => !v)}
                className={`w-11 h-6 rounded-full p-0.5 transition ${waEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${waEnabled ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
              </button>
            </label>
            {waEnabled && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <select
                    value={waCountry}
                    onChange={(e) => setWaCountry(e.target.value)}
                    dir="ltr"
                    className="px-3 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-start appearance-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                    ))}
                  </select>
                  <input
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder={ar ? "مثال: 5XXXXXXXX" : "e.g. 5XXXXXXXX"}
                    inputMode="tel"
                    dir="ltr"
                    className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 text-start"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{ar ? "اختر رمز الدولة ثم أدخل الرقم المحلي بدون +" : "Pick a country code, then enter the local number without +"}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{ar ? "عند التفعيل سيظهر زر واتساب لسلعتك للمشترين" : "When enabled, a WhatsApp button shows on your listings for buyers"}</p>
          </div>

          <button onClick={submit} disabled={saving} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}