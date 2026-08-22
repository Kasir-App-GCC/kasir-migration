import React, { useState } from "react";
import { X, Camera, Loader2, User, Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { syncAvatarToEntities } from "@/lib/syncAvatar";
import { userPhoneE164, digitsOnly } from "@/lib/phone";
import PhoneOtpVerifier from "@/components/PhoneOtpVerifier";
import WhatsAppIcon from "@/components/WhatsAppIcon";

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

export default function EditProfileDialog({ open, onClose }) {
  const { user, checkUserAuth } = useAuth();
  const { lang } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [waVerifiedNew, setWaVerifiedNew] = useState(false);
  const [waNumberNew, setWaNumberNew] = useState("");
  const [showWaVerifier, setShowWaVerifier] = useState(!user?.whatsapp_verified);
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
    setSaving(true);
    try {
      const update = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar,
      };
      if (waVerifiedNew && waNumberNew) {
        update.whatsapp_number = digitsOnly(waNumberNew);
        update.whatsapp_verified = true;
      }
      await base44.auth.updateMe(update);
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
              <input value={firstName} maxLength={15} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t("lastName")}</label>
              <input value={lastName} maxLength={15} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{t("username")}</label>
            <div className="flex items-center px-4 py-3 rounded-2xl bg-muted opacity-70">
              <span className="text-muted-foreground me-1">@</span>
              <span className="bg-transparent outline-none flex-1 lowercase select-none">{user?.username || ""}</span>
              <Lock size={14} className="text-muted-foreground shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">{ar ? "اسم المستخدم يُختار عند التسجيل ولا يمكن تغييره" : "Username is chosen at signup and cannot be changed"}</p>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <p className="text-sm font-semibold flex items-center gap-2"><WhatsAppIcon size={16} className="text-emerald-600" /> {ar ? "رقم واتساب" : "WhatsApp number"}</p>
            {showWaVerifier ? (
              <div className="space-y-1">
                <PhoneOtpVerifier
                  channel="whatsapp"
                  initialPhone={waVerifiedNew ? waNumberNew : (user?.whatsapp_verified && user?.whatsapp_number ? "+" + user.whatsapp_number : userPhoneE164(user))}
                  disallowE164={user?.whatsapp_verified ? "+" + user.whatsapp_number : ""}
                  onVerified={(e164) => {
                    setWaNumberNew(e164);
                    setWaVerifiedNew(true);
                    setShowWaVerifier(false);
                  }}
                />
                {(user?.whatsapp_verified || waVerifiedNew) && (
                  <button type="button" onClick={() => setShowWaVerifier(false)} className="text-xs text-muted-foreground underline">
                    {ar ? "إبقاء الرقم الحالي" : "Keep current number"}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
                <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold font-mono" dir="ltr">
                  +{waVerifiedNew ? digitsOnly(waNumberNew) : user?.whatsapp_number}
                </span>
                <button
                  type="button"
                  onClick={() => setShowWaVerifier(true)}
                  className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold underline"
                >
                  {ar ? "تغيير الرقم" : "Change number"}
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{ar ? "تحكّم في إظهار زر واتساب لسلعتك من إعدادات الملف." : "Control the WhatsApp button visibility from Profile settings."}</p>
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