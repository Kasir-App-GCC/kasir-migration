import React, { useState, useEffect } from "react";
import { ImagePlus, X, Sparkles, LocateFixed, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, SAUDI_CITIES, getSubcategories, getCityName, nearestCity } from "@/lib/constants";

export default function ListingForm({ initial, submitLabel, submittingLabel, onSubmit }) {
  const { user, lang } = useStore();
  const t = useT();
  const [images, setImages] = useState(initial?.images || []);
  const [title, setTitle] = useState(initial?.title || "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [category, setCategory] = useState(initial?.category || "");
  const [condition, setCondition] = useState(initial?.condition || "good");
  const [city, setCity] = useState(initial?.city || "");
  const [lat, setLat] = useState(initial?.lat ?? null);
  const [lng, setLng] = useState(initial?.lng ?? null);
  const [description, setDescription] = useState(initial?.description || "");
  const [subcategory, setSubcategory] = useState(initial?.subcategory || "");
  const [featured, setFeatured] = useState(!!initial?.featured);
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - images.length);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    // Upload each file independently and append as soon as it finishes,
    // so pictures appear one-by-one instead of all at once at the end.
    try {
      await Promise.all(
        files.map(async (f) => {
          try {
            const r = await base44.integrations.Core.UploadFile({ file: f });
            setImages((prev) => [...prev, r.file_url].slice(0, 5));
          } catch {}
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        if (c) setCity(c.en);
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!city && lat == null) detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!title || !price || !category || !city) return;
    setPosting(true);
    try {
      await onSubmit({
        title,
        price: Number(price),
        images: images.length ? images : ["https://picsum.photos/seed/" + encodeURIComponent(title) + "/600/600"],
        category,
        subcategory: subcategory || undefined,
        condition,
        city,
        lat,
        lng,
        description,
        featured,
      });
    } catch (e) {
      setPosting(false);
    }
  };

  const valid = title && price && category && city;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold mb-2 block">{t("photos")}</label>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const url = images[i];
            if (url) {
              return (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={url} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">{t("cover")}</span>}
                </div>
              );
            }
            const isUploading = uploading && i === images.length;
            return (
              <label key={i} className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer gap-1">
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={20} />
                    <span className="text-[10px] font-medium">{t("addPhotos")}</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("title")}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("price")}</label>
          <div className="flex items-center px-4 py-3 rounded-2xl bg-muted">
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder={t("pricePlaceholder")} className="bg-transparent outline-none flex-1" inputMode="numeric" />
            <span className="text-muted-foreground text-sm font-bold">{lang === "ar" ? "ر.س" : "SAR"}</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("selectCondition")}</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none">
            {CONDITIONS.map((c) => (
              <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("category")}</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none">
            <option value="">{t("selectCategory")}</option>
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("city")}</label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted">
            <MapPin size={16} className="text-muted-foreground shrink-0" />
            <span className={`flex-1 text-sm truncate ${city ? "font-semibold" : "text-muted-foreground"}`}>
              {city ? getCityName(city, lang) : (locating ? t("locating") : t("locationNeeded"))}
            </span>
            <button type="button" onClick={detectLocation} className="text-xs font-semibold text-primary flex items-center gap-1 shrink-0">
              <LocateFixed size={13} /> {t("useMyLocation")}
            </button>
          </div>
        </div>
      </div>

      {category && getSubcategories(category).length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("subcategory")}</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {getSubcategories(category).map((s) => (
              <button
                key={s.en}
                type="button"
                onClick={() => setSubcategory(subcategory === s.en ? "" : s.en)}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${subcategory === s.en ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}
              >
                {lang === "ar" ? s.ar : s.en}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("description")}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={4} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none" />
      </div>

      <button
        type="button"
        onClick={() => setFeatured(!featured)}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition ${featured ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "border-border bg-card"}`}
      >
        <span className="flex items-center gap-2.5 text-start">
          <Sparkles size={18} className="text-amber-500" />
          <span>
            <span className="text-sm font-semibold block">{t("promoteListing")}</span>
            <span className="text-xs text-muted-foreground">{t("promoteDesc")} · {t("promoFee")}</span>
          </span>
        </span>
        <span className={`w-11 h-6 rounded-full p-0.5 transition ${featured ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
          <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${featured ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
        </span>
      </button>

      <button
        onClick={submit}
        disabled={!valid || posting}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg disabled:opacity-50 hover:bg-primary/90"
      >
        {posting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}