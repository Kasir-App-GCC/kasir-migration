import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X, Sparkles, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, SAUDI_CITIES, getCategory } from "@/lib/constants";

export default function Sell() {
  const { user, lang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("used");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [isFamily, setIsFamily] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map((f) => base44.integrations.Core.UploadFile({ file: f }).then((r) => r.file_url))
      );
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!title || !price || !category || !city) return;
    setPosting(true);
    try {
      await base44.entities.Item.create({
        title,
        price: Number(price),
        images: images.length ? images : ["https://picsum.photos/seed/" + encodeURIComponent(title) + "/600/600"],
        category,
        condition,
        city,
        description,
        seller_id: user?.id,
        seller_name: user?.name,
        is_family: isFamily,
        status: "available",
      });
      nav("/");
    } catch (e) {
      setPosting(false);
    }
  };

  const valid = title && price && category && city;

  return (
    <div className="pt-3 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-extrabold">{t("sell")}</h1>

      {/* Photos */}
      <div>
        <label className="text-sm font-semibold mb-2 block">{t("photos")}</label>
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
              <img src={url} className="w-full h-full object-cover" />
              <button
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
              {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">Cover</span>}
            </div>
          ))}
          {images.length < 8 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer gap-1">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ImagePlus size={22} />
                  <span className="text-[11px] font-medium">{t("addPhotos")}</span>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
            </label>
          )}
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
            <span className="text-muted-foreground text-sm font-bold">ر.س</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("selectCondition")}</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none">
            <option value="new">{t("condition_new")}</option>
            <option value="like_new">{t("condition_like_new")}</option>
            <option value="used">{t("condition_used")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("category")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none">
            <option value="">{t("selectCategory")}</option>
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("selectCityLabel")}</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none">
            <option value="">{t("selectCity")}</option>
            {SAUDI_CITIES.map((c) => (
              <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("description")}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={4} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none" />
      </div>

      <button
        onClick={() => setIsFamily(!isFamily)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition ${
          isFamily ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : "border-border bg-card"
        }`}
      >
        <span className="flex items-center gap-3">
          <Sparkles size={20} className={isFamily ? "text-emerald-600" : "text-muted-foreground"} />
          <span className="text-start">
            <span className="font-semibold block">{t("productiveFamilies")}</span>
            <span className="text-xs text-muted-foreground">{t("featuredDesc")}</span>
          </span>
        </span>
        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isFamily ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30"}`}>
          {isFamily && <Check size={14} />}
        </span>
      </button>

      <button
        onClick={submit}
        disabled={!valid || posting}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg disabled:opacity-50 hover:bg-primary/90"
      >
        {posting ? t("posting") : t("postListing")}
      </button>
    </div>
  );
}