import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { syncAvatarToEntities } from "@/lib/syncAvatar";
import { Camera, Loader2, User } from "lucide-react";
import { COUNTRIES, getCountry } from "@/lib/countries";
import SheetSelect from "@/components/SheetSelect";

export default function ProfileSetup() {
  const { user, checkUserAuth } = useAuth();
  const { lang, setCountry } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [countryCode, setCountryCode] = useState(user?.country_code || "+966");
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [intent, setIntent] = useState(user?.intent || "");
  const [country, setCountryState] = useState(user?.country || "SA");

  const countryCodes = [
    { code: "+966", label: "🇸🇦 +966", name: ar ? "السعودية" : "Saudi Arabia" },
    { code: "+971", label: "🇦🇪 +971", name: ar ? "الإمارات" : "UAE" },
    { code: "+965", label: "🇰🇼 +965", name: ar ? "الكويت" : "Kuwait" },
    { code: "+974", label: "🇶🇦 +974", name: ar ? "قطر" : "Qatar" },
    { code: "+973", label: "🇧🇭 +973", name: ar ? "البحرين" : "Bahrain" },
    { code: "+968", label: "🇴🇲 +968", name: ar ? "عمان" : "Oman" },
    { code: "+962", label: "🇯🇴 +962", name: ar ? "الأردن" : "Jordan" },
    { code: "+963", label: "🇸🇾 +963", name: ar ? "سوريا" : "Syria" },
    { code: "+964", label: "🇮🇶 +964", name: ar ? "العراق" : "Iraq" },
    { code: "+967", label: "🇾🇪 +967", name: ar ? "اليمن" : "Yemen" },
    { code: "+9665", label: "🇸🇦 +9665", name: ar ? "السعودية (جوال)" : "Saudi (mobile)" },
    { code: "+20", label: "🇪🇬 +20", name: ar ? "مصر" : "Egypt" },
    { code: "+1", label: "🇺🇸 +1", name: ar ? "أمريكا" : "USA" },
    { code: "+44", label: "🇬🇧 +44", name: ar ? "بريطانيا" : "UK" },
  ];
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");

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

  useEffect(() => {
    const uname = cleanUsername(username);
    if (uname.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("checkUsername", { username: uname });
        setUsernameStatus(res?.data?.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [username]);

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
    if (!intent) {
      setError(ar ? "اختر وش جاي تسويه" : "Please pick what you're here for");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) {
      setError(ar ? "اكتب رقم جوال صحيح" : "Please enter a valid phone number");
      return;
    }
    setSaving(true);
    try {
      const check = await base44.functions.invoke("checkUsername", { username: uname });
      if (!check?.data?.available) {
        setError(ar ? "اسم المستخدم محجوز، جرّب غيره" : "This username is taken, try another");
        setSaving(false);
        return;
      }
      await base44.auth.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: uname,
        phone: digits,
        country_code: countryCode,
        country,
        avatar,
        intent,
      });
      await checkUserAuth();
      setCountry(country);
      await syncAvatarToEntities(user.id, avatar);
    } catch (err) {
      setError(err.message || (ar ? "فشل الحفظ" : "Failed to save"));
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold">{t("setupProfile")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("setupProfileDesc")}</p>
        </div>

        <div className="flex flex-col items-center mb-2">
          <label className="relative cursor-pointer group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 end-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
              <Camera size={16} />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>
          <p className="text-xs text-muted-foreground mt-3">{t("uploadPhoto")} · {t("optional")}</p>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
        )}

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? "دولتك" : "Your country"} *</label>
            <div className="grid grid-cols-3 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCountryState(c.code); setCountryCode("+" + getCountry(c.code).phoneCode); }}
                  className={`py-2.5 rounded-2xl text-sm font-semibold border transition flex items-center gap-1.5 justify-center ${country === c.code ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="truncate">{ar ? c.ar : c.en}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t("firstName")} *</label>
              <input
                value={firstName}
                maxLength={15}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t("lastName")}</label>
              <input
                value={lastName}
                maxLength={15}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{t("username")} *</label>
            <div className="flex items-center px-4 py-3 rounded-2xl bg-muted">
              <span className="text-muted-foreground me-1">@</span>
              <input
                value={username}
                maxLength={15}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="bg-transparent outline-none flex-1 lowercase"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
            {usernameStatus === "checking" && <p className="text-xs text-muted-foreground">{ar ? "نتأكد من التوفر…" : "Checking availability…"}</p>}
            {usernameStatus === "available" && <p className="text-xs text-emerald-600 font-medium">{ar ? "متاح ✓" : "Available ✓"}</p>}
            {usernameStatus === "taken" && <p className="text-xs text-rose-600 font-medium">{ar ? "محجوز، جرّب غيره" : "Taken, try another"}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? "رقم الجوال" : "Phone number"} *</label>
            <div className="flex gap-2">
              <SheetSelect
                value={countryCode}
                onChange={setCountryCode}
                label={ar ? "رمز الدولة" : "Country code"}
                buttonClassName="px-3 py-3 text-sm font-semibold min-w-[110px]"
                options={countryCodes.map((c) => ({ value: c.code, label: c.label }))}
              />
              <input
                value={phone}
                maxLength={15}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={ar ? "5xxxxxxxx" : "5XXXXXXXX"}
                inputMode="tel"
                className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30"
              />
            </div>
            <p className="text-xs text-muted-foreground">{ar ? "مثال: 512345678" : "Example: 512345678"}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{t("intentQuestion")} *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "buy", label: t("intentBuy") },
                { id: "sell", label: t("intentSell") },
                { id: "both", label: t("intentBoth") },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setIntent(o.id)}
                  className={`py-3 rounded-2xl text-sm font-semibold border transition ${intent === o.id ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={saving || usernameStatus === "taken" || usernameStatus === "checking"}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? (ar ? "نحفظ…" : "Saving…") : t("continue")}
          </button>
        </div>
      </div>
    </div>
  );
}