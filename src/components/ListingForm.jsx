import React, { useState, useEffect } from "react";
import { ImagePlus, X, Sparkles, LocateFixed, MapPin, GripVertical, Globe } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, getSubcategories, getCityName } from "@/lib/constants";
import { getCities, nearestCityInCountry, getCountry, convertCurrency } from "@/lib/countries";

// Convert Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits to ASCII 0-9
function normalizeDigits(s) {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    const n = code - 0x0660 < 10 ? code - 0x0660 : code - 0x06f0;
    return String(n);
  });
}

export default function ListingForm({ initial, submitLabel, submittingLabel, onSubmit }) {
  const { user, lang, country } = useStore();
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
  const [subcats, setSubcats] = useState(
    Array.isArray(initial?.subcategory) ? initial.subcategory : (initial?.subcategory ? [initial.subcategory] : [])
  );
  const [boostHours, setBoostHours] = useState(0);
  const [boostCross, setBoostCross] = useState(false);
  const ar = lang === "ar";
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCityInCountry(pos.coords.latitude, pos.coords.longitude, country || "SA");
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
    if (!city) detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - images.length);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
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

  const onDragEnd = (res) => {
    if (!res.destination || res.destination.index === res.source.index) return;
    setImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(res.source.index, 1);
      copy.splice(res.destination.index, 0, moved);
      return copy;
    });
  };

  const toggleSub = (s) => {
    setSubcats((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const onPriceChange = (e) => setPrice(normalizeDigits(e.target.value).replace(/\D/g, ""));

  const submit = async () => {
    if (!title || !price || !category || !city) return;
    setPosting(true);
    try {
      await onSubmit({
        title,
        price: Number(price),
        images: images.length ? images : ["https://picsum.photos/seed/" + encodeURIComponent(title) + "/600/600"],
        category,
        subcategory: subcats.length ? subcats : undefined,
        condition,
        city,
        country: country || "SA",
        lat,
        lng,
        description,
        featured: false,
        boost_hours: boostHours,
        boost_cross_country: boostCross,
        boost_amount: boostAmount,
      });
    } catch (e) {
      setPosting(false);
    }
  };

  const valid = title && price && category && city;
  const boostAmount = boostHours > 0 ? boostHours * 10 + (boostCross ? boostHours * 7 : 0) : 0;
  const cur = getCountry(country || "SA");
  const boostDisplay = convertCurrency(boostAmount, "SA", country || "SA");
  const crossRateDisplay = convertCurrency(7, "SA", country || "SA");
  const fmt = (n) => Number(n).toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 2 });
  const subs = category ? getSubcategories(category) : [];

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold mb-2 block">{t("photos")}</label>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const url = images[i];
                  if (url) {
                    return (
                      <Draggable key={url} draggableId={url} index={i}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`relative aspect-square rounded-xl overflow-hidden flex-1 select-none ${snap.isDragging ? "opacity-70 ring-2 ring-primary" : ""}`}
                          >
                            <img src={url} className="w-full h-full object-cover pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/25 transition pointer-events-none">
                              <GripVertical size={18} className="text-white opacity-70 drop-shadow" />
                            </div>
                            <button
                              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                              className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center z-10"
                            >
                              <X size={14} />
                            </button>
                            {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">{t("cover")}</span>}
                          </div>
                        )}
                      </Draggable>
                    );
                  }
                  const isUploading = uploading && i === images.length;
                  return (
                    <label key={i} className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer gap-1 flex-1">
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <p className="text-[11px] text-muted-foreground mt-1.5">{t("dragToReorder")}</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("title")}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("price")}</label>
          <div className="flex items-center px-4 py-3 rounded-2xl bg-muted">
            <input value={price} onChange={onPriceChange} placeholder={t("pricePlaceholder")} className="bg-transparent outline-none flex-1" inputMode="numeric" />
            <span className="text-muted-foreground text-sm font-bold">{ar ? cur.currencyAr : cur.currency}</span>
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

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("category")}</label>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcats([]); }} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none">
          <option value="">{t("selectCategory")}</option>
          {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
            <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("location")}</label>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted">
          <MapPin size={16} className="text-muted-foreground shrink-0" />
          {locating ? (
            <span className="flex-1 text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              {t("locating")}
            </span>
          ) : city ? (
            <span className="flex-1 text-sm font-semibold truncate">{getCityName(city, lang)}</span>
          ) : (
            <select value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 bg-transparent outline-none text-sm">
              <option value="">{t("selectCity")}</option>
              {getCities(country || "SA").map((c) => (
                <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={detectLocation} className="text-xs font-semibold text-primary flex items-center gap-1 shrink-0">
            <LocateFixed size={13} /> {t("useMyLocation")}
          </button>
        </div>
      </div>

      {subs.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-semibold">{t("subcategory")}</label>
          <div className="flex flex-wrap gap-2">
            {subs.map((s) => {
              const active = subcats.includes(s.en);
              return (
                <button
                  key={s.en}
                  type="button"
                  onClick={() => toggleSub(s.en)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}
                >
                  {lang === "ar" ? s.ar : s.en}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("description")}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={4} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none" />
      </div>

      <div className="p-3.5 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles size={18} className="text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold block">{t("promoteListing")}</p>
            <p className="text-xs text-muted-foreground">{ar ? "تعزيز الإعلان ليظهر في المميز" : "Boost your listing to appear in featured"}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-semibold">{ar ? "المدة" : "Duration"}</span>
            <span className="font-bold">{boostHours} {ar ? "ساعة" : "h"}{boostHours >= 72 ? ` · ${ar ? "٣ أيام" : "3 days"}` : ""}</span>
          </div>
          <input
            type="range"
            min={0}
            max={72}
            step={1}
            value={boostHours}
            onChange={(e) => setBoostHours(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span><span>24</span><span>48</span><span>72</span>
          </div>
        </div>
        {boostHours > 0 && (
          <>
            <button
              type="button"
              onClick={() => setBoostCross(!boostCross)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-muted"
            >
              <span className="flex items-center gap-2 text-start">
                <Globe size={16} className="text-primary" />
                <span>
                  <span className="text-sm font-semibold block">{ar ? "عرض في كل الدول" : "Show across all countries"}</span>
                  <span className="text-xs text-muted-foreground">+{fmt(crossRateDisplay)} {ar ? `${cur.currencyAr} / ساعة` : `${cur.currency} / hour`}</span>
                </span>
              </span>
              <span className={`w-11 h-6 rounded-full p-0.5 transition ${boostCross ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${boostCross ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
              </span>
            </button>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{ar ? "الإجمالي" : "Total"}</span>
              <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{fmt(boostDisplay)} {ar ? cur.currencyAr : cur.currency}</span>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">{ar ? "الدفع قريباً — الميزة قيد التطوير" : "Payment coming soon — feature in development"}</p>
          </>
        )}
      </div>

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