import React, { useState } from "react";
import { X, Camera, Loader2, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";

export default function EditProfileDialog({ open, onClose }) {
  const { user, checkUserAuth } = useAuth();
  const { lang } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || null);
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
      await base44.auth.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: uname,
        avatar,
      });
      await checkUserAuth();
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

          <button onClick={submit} disabled={saving} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}