import React, { useState, useEffect } from "react";
import { ImagePlus, X, Sparkles, LocateFixed, MapPin, GripVertical, Globe } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, getSubcategories, getCityName } from "@/lib/constants";
import { getCities, nearestCityInCountry, getCountry, convertCurrency } from "@/lib/countries";
import { computeBoostCost, buildBoostSegments, existingBoostHours, BOOST_MAX_HOURS, BOOST_MIN_HOURS } from "@/lib/boostPricing";
import MapPinPicker from "@/components/MapPinPicker";
import { Image } from "@/components/ui/image";
import { compressImage } from "@/lib/compressImage";
import { useToast } from "@/components/ui/use-toast";
import SheetSelect from "@/components/SheetSelect";
import ReviewTagChips from "@/components/ReviewTagChips";
import { getListingTags } from "@/lib/listingTags";

// Convert Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits to ASCII 0-9
function normalizeDigits(s) {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    const n = code - 0x0660 < 10 ? code - 0x0660 : code - 0x06f0;
    return String(n);
  });
}

export default function ListingForm({ initial, submitLabel, submittingLabel, onSubmit, boostReceiptRequired = true, boostLocked = false }) {
  const { user, lang, country } = useStore();
  const t = useT();
  const { toast } = useToast();
  const [images, setImages] = useState(initial?.images || []);
  const [title, setTitle] = useState(initial?.title || "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [category, setCategory] = useState(initial?.category || "");
  const [condition, setCondition] = useState(initial?.condition || "good");
  const [city, setCity] = useState(initial?.city || "");
  const [locationName, setLocationName] = useState(initial?.location_name || "");
  const [lat, setLat] = useState(initial?.lat ?? null);
  const [lng, setLng] = useState(initial?.lng ?? null);
  const [description, setDescription] = useState(initial?.description || "");
  const [subcats, setSubcats] = useState(
    Array.isArray(initial?.subcategory) ? initial.subcategory : (initial?.subcategory ? [initial.subcategory] : [])
  );
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial.tags : []);
  const [boostHours, setBoostHours] = useState(0);
  const [boostCross, setBoostCross] = useState(false);
  const ar = lang === "ar";
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPos, setMapPos] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Reverse-geocode coordinates to an accurate place name for display.
  const reverseGeocode = async (la, ln) => {
    try {
      const res = await base44.functions.invoke("geocodeLocation", {
        lat: la, lng: ln, country: country || "SA", lang,
      });
      const name = res?.data?.name;
      if (name) setLocationName(String(name).slice(0, 120));
    } catch {}
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: ar ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCityInCountry(pos.coords.latitude, pos.coords.longitude, country || "SA");
        if (c) setCity(c.en);
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast({ title: ar ? "تعذّر تحديد موقعك" : "Couldn't get your location", description: ar ? "جرّب اختيار الموقع على الخريطة" : "Try selecting on the map", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
            const compressed = await compressImage(f);
            const r = await base44.integrations.Core.UploadFile({ file: compressed });
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
  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const tagOptions = getListingTags(category);

  const onPriceChange = (e) => setPrice(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 8));

  const submit = async () => {
    if (!title || !price || !category || !city || images.length === 0) return;
    setPosting(true);
    try {
      await onSubmit({
        title,
        price: Number(price),
        images: images.length ? images : ["https://picsum.photos/seed/" + encodeURIComponent(title) + "/600/600"],
        category,
        subcategory: subcats.length ? subcats : undefined,
        condition,
        tags: tags.length ? tags : undefined,
        city,
        location_name: locationName || undefined,
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

  const valid = title && price && category && city && images.length > 0;
  // Cumulative tiered boost pricing: each new hour is priced by where it lands
  // in the 0–168h accumulated range (existing boost + new hours), so stacking
  // short boosts can't re-earn the cheapest tier every time.
  //   0–24h → 5/hr (+3), 24–48h → 4/hr (+2), 48–72h → 3/hr (+1), 72h–1wk → 1/hr (+1).
  const existingHours = existingBoostHours(initial?.featured_until);
  const maxBoost = Math.max(0, BOOST_MAX_HOURS - existingHours);
  const boostAmount = boostHours > 0 ? computeBoostCost(existingHours, boostHours, boostCross).amount : 0;
  const boostSegments = boostHours > 0 ? buildBoostSegments(existingHours, boostHours) : [];
  const totalAfter = Math.min(existingHours + boostHours, BOOST_MAX_HOURS);
  const cur = getCountry(country || "SA");
  const boostDisplay = convertCurrency(boostAmount, "SA", country || "SA");
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
                            <Image src={url} fittingType="fill" className="w-full h-full pointer-events-none" style={{ display: "block" }} />
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
        {images.length === 0 && (
          <p className="text-[11px] text-rose-500 font-semibold mt-1">{ar ? "صورة واحدة على الأقل مطلوبة" : "At least one photo is required"}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("title")}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 50))} maxLength={50} placeholder={t("titlePlaceholder")} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
        <div className="flex justify-end text-[11px] text-muted-foreground mt-1">{(title || "").length}/50</div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("price")}</label>
        <div className="flex items-center px-4 py-3 rounded-2xl bg-muted">
          <input value={price} onChange={onPriceChange} placeholder={t("pricePlaceholder")} className="bg-transparent outline-none flex-1" inputMode="numeric" />
          <span className="text-muted-foreground text-sm font-bold">{ar ? cur.currencyAr : cur.currency}</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("category")}</label>
        <SheetSelect
          value={category}
          onChange={(v) => { setCategory(v); setSubcats([]); setTags([]); }}
          placeholder={t("selectCategory")}
          label={t("category")}
          options={CATEGORIES.filter((c) => c.id !== "all").map((c) => ({ value: c.id, label: lang === "ar" ? c.ar : c.en }))}
        />
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
        <label className="text-sm font-semibold">{t("selectCondition")}</label>
        <SheetSelect
          value={condition}
          onChange={setCondition}
          label={t("selectCondition")}
          buttonClassName="border-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300/40"
          options={CONDITIONS.map((c) => ({ value: c.id, label: lang === "ar" ? c.ar : c.en }))}
        />
      </div>

      {tagOptions.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-semibold">{ar ? "مميزات سريعة" : "Quick tags"}</label>
          <p className="text-[11px] text-muted-foreground -mt-0.5">{ar ? "اختر ما ينطبق على منتجك ليظهر للمشترين" : "Pick what applies — buyers will see these"}</p>
          <ReviewTagChips options={tagOptions} selected={tags} onToggle={toggleTag} lang={lang} />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("location")}</label>
        <div className="rounded-2xl bg-muted p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground shrink-0" />
            <SheetSelect
              value={city}
              onChange={(v) => {
                setCity(v);
                setLocationName("");
                const c = getCities(country || "SA").find((x) => x.en === v);
                if (c) { setLat(c.lat); setLng(c.lng); }
              }}
              placeholder={t("selectCity")}
              label={t("location")}
              buttonClassName="bg-transparent px-0 py-1.5 text-sm font-semibold flex-1"
              options={getCities(country || "SA").map((c) => ({ value: c.en, label: lang === "ar" ? c.ar : c.en }))}
            />
          </div>
          {lat != null && lng != null && (
            <p className="text-[11px] text-muted-foreground ps-6">
              {locationName ? <span className="font-semibold text-foreground">{locationName}</span> : (ar ? "الإحداثيات" : "Coordinates") + ": "}
              {(!locationName ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "")}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={detectLocation} disabled={locating} className="flex-1 py-2.5 rounded-xl bg-card border border-border/60 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
              {locating ? <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> : <LocateFixed size={14} />} {t("useMyLocation")}
            </button>
            <button type="button" onClick={() => { setMapPos(lat != null && lng != null ? { lat, lng } : null); setMapOpen(true); }} className="flex-1 py-2.5 rounded-xl bg-card border border-border/60 text-xs font-semibold flex items-center justify-center gap-1.5">
              <Globe size={14} /> {ar ? "اختر على الخريطة" : "Select on map"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("description")}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} maxLength={500} placeholder={t("descriptionPlaceholder")} rows={4} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none" />
        <div className="flex justify-end text-[11px] text-muted-foreground">{(description || "").length}/500</div>
      </div>

      <div className="p-3.5 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles size={18} className="text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{t("promoteListing")}</p>
            <p className="text-xs text-muted-foreground">{ar ? "تعزيز الإعلان ليظهر في المميز" : "Boost your listing to appear in featured"}</p>
          </div>
        </div>
        {boostLocked && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {ar ? "هذا الإعلان مُعزَّز حالياً — لا يمكن تعديل الترويج من هنا" : "This listing is currently promoted — promotion can't be modified here"}
              {initial?.featured_until && (
                <>
                  {" · "}
                  {ar ? "ينتهي في " : "Ends "}
                  {new Date(initial.featured_until).toLocaleString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {ar ? "يمكنك طلب تعزيز جديد بعد انتهائه" : "you can request a new boost after it ends"}
                </>
              )}
            </p>
          </div>
        )}
        <div className={boostLocked ? "opacity-50 pointer-events-none" : ""}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-semibold">{ar ? "المدة المضافة" : "Hours to add"}</span>
            <span className="font-bold">{boostHours > 0 ? (() => { const days = boostHours / 24; const dayLabel = days >= 1 && boostHours % 24 === 0 ? ` (${days} ${ar ? (days === 1 ? "يوم" : days === 2 ? "يومان" : days <= 10 ? "أيام" : "يوم") : days === 1 ? "day" : "days"})` : ""; return `${boostHours} ${ar ? "ساعة" : "h"}${dayLabel}`; })() : (ar ? "بدون تعزيز" : "No boost")}</span>
          </div>
          {existingHours > 0 && (
            <p className="text-[11px] text-muted-foreground mb-1.5">
              {ar ? `تعزيز حالي: ${existingHours} ساعة متبقية` : `Current boost: ${existingHours}h remaining`}
            </p>
          )}
          <input
            type="range"
            min={0}
            max={maxBoost}
            step={1}
            value={boostLocked ? 0 : boostHours}
            onChange={(e) => {
              const v = Number(e.target.value);
              setBoostHours(v === 1 ? BOOST_MIN_HOURS : v);
            }}
            disabled={maxBoost === 0 || boostLocked}
            className="w-full accent-amber-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span>{maxBoost}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const hrs = d * 24;
              if (hrs > maxBoost) return null;
              const label = d === 7 ? (ar ? "أسبوع" : "1 Week") : d === 1 ? (ar ? "يوم" : "1 Day") : d === 2 ? (ar ? "يومان" : "2 Days") : (ar ? `${d} أيام` : `${d} Days`);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setBoostHours(hrs)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${boostHours === hrs ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {maxBoost === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">{ar ? "وصلت للحد الأقصى (أسبوع واحد)" : "Max boost reached (1 week)"}</p>
          )}
          {boostHours > 0 && boostSegments.length > 0 && (
            <div className="mt-2.5 space-y-1 text-xs">
              {boostSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between text-muted-foreground">
                  <span>{seg.hours}{ar ? "س" : "h"} × {fmt(convertCurrency(seg.base, "SA", country || "SA"))} {ar ? cur.currencyAr : cur.currency}</span>
                  <span className="font-semibold text-foreground">{fmt(convertCurrency(seg.hours * seg.base, "SA", country || "SA"))}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">{ar ? "الإجمالي بعد التعزيز" : "Total after boost"}</span>
                <span className="font-semibold">{fmt(boostDisplay)} {ar ? cur.currencyAr : cur.currency}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{ar ? <>سيظهر إعلانك في قسم المميز طوال هذه المدة لجميع المدن في دولتك {cur.flag}</> : <>Your listing will appear in the Featured section for this duration across all cities in your country {cur.flag}</>}</p>
            </div>
          )}
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
                  <span className="text-sm font-semibold block">{ar ? "عرض في كل دول الخليج" : "Show across all Gulf countries"}</span>
                </span>
              </span>
              <span className={`w-11 h-6 rounded-full p-0.5 transition ${boostCross ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${boostCross ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
              </span>
            </button>
            {boostCross && boostSegments.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{ar ? "إضافة عرض كل دول الخليج" : "Gulf countries add-on"}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">+{fmt(convertCurrency(boostSegments.reduce((s, seg) => s + seg.hours * seg.cross, 0), "SA", country || "SA"))} {ar ? cur.currencyAr : cur.currency}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{ar ? "الإجمالي" : "Total"}</span>
              <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{fmt(boostDisplay)} {ar ? cur.currencyAr : cur.currency}</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50">
              <p className="text-xs text-muted-foreground">{ar ? "سيتم تفعيل التعزيز بعد مراجعة الإدارة والدفع عبر بوابة الدفع الإلكترونية (قريباً)." : "The boost is activated after admin review and payment via the online gateway (coming soon)."}</p>
            </div>
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

      {mapOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMapOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{ar ? "اختر موقع الإعلان" : "Pick listing location"}</h3>
              <button onClick={() => setMapOpen(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <MapPinPicker
              center={mapPos || (getCities(country || "SA")[0] || { lat: 24.7136, lng: 46.6753 })}
              radius={0}
              onPick={(p) => setMapPos(p)}
            />
            {mapPos && (
              <p className="text-xs text-muted-foreground mt-2">
                {ar ? "الموقع" : "Location"}: {mapPos.lat.toFixed(4)}, {mapPos.lng.toFixed(4)}
                {(() => { const c = nearestCityInCountry(mapPos.lat, mapPos.lng, country || "SA"); return c ? ` · ${ar ? c.ar : c.en}` : ""; })()}
              </p>
            )}
            <button
              onClick={() => {
                if (!mapPos) return;
                const c = nearestCityInCountry(mapPos.lat, mapPos.lng, country || "SA");
                if (c) setCity(c.en);
                setLat(mapPos.lat);
                setLng(mapPos.lng);
                reverseGeocode(mapPos.lat, mapPos.lng);
                setMapOpen(false);
              }}
              disabled={!mapPos}
              className="mt-4 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
            >
              {t("apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}