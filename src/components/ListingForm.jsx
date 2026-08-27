import React, { useState, useEffect, useRef } from "react";
import { ImagePlus, X, Sparkles, LocateFixed, MapPin, GripVertical, Globe, Lock, Check, Camera, Wand2, Truck, Gift, ShieldCheck, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, getSubcategories, getCityName } from "@/lib/constants";
import { getCities, nearestCityInCountry, getCountry, convertCurrency, resolveCityFromGeocode } from "@/lib/countries";
import { computeBoostPrice, existingBoostHours, BOOST_MAX_HOURS, BOOST_MIN_HOURS } from "@/lib/boostPricing";
import MapPinPicker from "@/components/MapPinPicker";
import { Image } from "@/components/ui/image";
import CurrencySymbol from "@/components/CurrencySymbol";
import { compressImage } from "@/lib/compressImage";
import { useToast } from "@/components/ui/use-toast";
import SheetSelect from "@/components/SheetSelect";
import ReviewTagChips from "@/components/ReviewTagChips";
import { getListingTags } from "@/lib/listingTags";
import { getSpecFields } from "@/lib/specs";
import ImageEditor from "@/components/ImageEditor";
import CameraCapture from "@/components/CameraCapture";
import VerificationDialog from "@/components/VerificationDialog";
import RealEstateAdLicenseFields from "@/components/RealEstateAdLicenseFields";
import { useNavigate } from "react-router-dom";

// Convert Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits to ASCII 0-9
function normalizeDigits(s) {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    const n = code - 0x0660 < 10 ? code - 0x0660 : code - 0x06f0;
    return String(n);
  });
}

export default function ListingForm({ initial, submitLabel, submittingLabel, onSubmit, onSaveDraft, onAutoSaveDraft, boostReceiptRequired = true, boostLocked = false }) {
  const { user, lang, country } = useStore();
  const t = useT();
  const { toast } = useToast();
  const nav = useNavigate();
  const { refreshUser } = useAuth();
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
    Array.isArray(initial?.subcategory) ? initial.subcategory : initial?.subcategory ? [initial.subcategory] : []
  );
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial.tags : []);
  const [specs, setSpecs] = useState(initial?.specs && typeof initial.specs === "object" ? initial.specs : {});
  const [boostHours, setBoostHours] = useState(0);
  const ar = lang === "ar";
  const verified = !!user?.is_trusted;
  const maxPhotos = verified ? 20 : 5;
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPos, setMapPos] = useState(null);
  const [mapHint, setMapHint] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [editQueue, setEditQueue] = useState([]);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [willingToShip, setWillingToShip] = useState(!!initial?.willing_to_ship);
  const [shippingFee, setShippingFee] = useState(initial?.shipping_fee != null ? String(initial.shipping_fee) : "");
  const [deliversWithinCity, setDeliversWithinCity] = useState(!!initial?.delivers_within_city);
  const [useFreeBoost, setUseFreeBoost] = useState(false);
  const [freeBoostAvailable, setFreeBoostAvailable] = useState(null);
  const [reAdLicense, setReAdLicense] = useState(
    initial && typeof initial === "object" ? {
      re_ad_license_number: initial.re_ad_license_number || "",
      re_ad_license_link: initial.re_ad_license_link || "",
      re_ad_license_expiry: initial.re_ad_license_expiry || "",
      re_deed_area: initial.re_deed_area || "",
      re_plan_plot: initial.re_plan_plot || "",
      re_brokerage_contract_number: initial.re_brokerage_contract_number || "",
      re_title_deed_number: initial.re_title_deed_number || "",
      re_title_deed_doc: initial.re_title_deed_doc || "",
      re_has_mortgage: !!initial.re_has_mortgage,
      re_mortgage_details: initial.re_mortgage_details || "",
    } : {}
  );


  // Draft auto-save bookkeeping. `postedRef` skips the exit-time draft save
  // when the user tapped Post; `savedRef` skips it after an explicit Save-draft;
  // `dataRef` always holds the latest assembled form data for the unmount save.
  const postedRef = useRef(false);
  const savedRef = useRef(false);
  const dataRef = useRef(null);
  const isDraft = initial?.status === "draft";

  // Reverse-geocode coordinates to an accurate place name for display.
  const reverseGeocode = async (la, ln) => {
    try {
      const res = await base44.functions.invoke("geocodeLocation", {
        lat: la, lng: ln, country: country || "SA", lang
      });
      const d = res?.data;
      if (d?.name) setLocationName(String(d.name).slice(0, 120));
      // Resolve the canonical major city from the reverse-geocoded region
      // (e.g. "Riyadh Region" → "Riyadh", not the sub-municipality "Diriyah").
      const match = resolveCityFromGeocode(d, country || "SA");
      if (match) setCity(match.en);
    } catch {}
  };

  // Live reverse-geocode the pin while picking on the map so the hint label
  // shows the accurate place name (e.g. "Al Aarid, Riyadh Region") instead of
  // the nearest static city (which can be a smaller municipality like Diriyah).
  useEffect(() => {
    if (!mapPos) {setMapHint("");return;}
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("geocodeLocation", { lat: mapPos.lat, lng: mapPos.lng, country: country || "SA", lang });
        if (!cancelled && res?.data?.name) setMapHint(String(res.data.name).slice(0, 120));
      } catch {}
    }, 400);
    return () => {cancelled = true;clearTimeout(handle);};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPos]);

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

  // Refresh the current user on mount so the real estate license status is
  // current — an admin may have approved the license in another session.
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!city) detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A verified user gets one free 1-day boost (lifetime) — check if already used.
  useEffect(() => {
    if (!user?.id || !user?.is_trusted) return;
    (async () => {
      try {
        const existing = await base44.entities.BoostRequest.filter({ user_id: user.id, is_free: true }, "-created_date", 1);
        setFreeBoostAvailable(!existing || existing.length === 0);
      } catch {
        setFreeBoostAvailable(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.is_trusted]);

  const onPick = (e) => {
    const files = Array.from(e.target.files || []).slice(0, maxPhotos - images.length);
    e.target.value = "";
    if (!files.length) return;
    setEditQueue(files);
  };

  const handleFileDone = async (f, idx) => {
    setUploading(true);
    try {
      const compressed = await compressImage(f);
      const r = await base44.integrations.Core.UploadFile({ file: compressed });
      setImages((prev) => [...prev, r.file_url].slice(0, maxPhotos));
    } catch {}
    setUploading(false);
    setEditQueue((q) => q.filter((_, i) => i !== idx));
  };

  const handleSkipFile = (idx) => {
    setEditQueue((q) => q.filter((_, i) => i !== idx));
  };

  const onCameraDone = (files) => {
    setCameraOpen(false);
    const remaining = maxPhotos - images.length;
    const accepted = Array.from(files).slice(0, remaining);
    if (accepted.length) setEditQueue(accepted);
  };

  // AI photo analysis: sends the cover photos to a vision LLM and auto-fills
  // the listing details (title, category, condition, subcategory, description,
  // and a price estimate when the price is still empty).
  const analyze = async () => {
    if (!images.length || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke("analyzeListingImage", { image_urls: images.slice(0, 5), lang });
      const s = res?.data?.suggestion;
      if (s) {
        if (s.title) setTitle(String(s.title).slice(0, 50));
        if (s.category && CATEGORIES.find((c) => c.id === s.category)) {
          setCategory(s.category);
          setSubcats([]);
          setTags([]);
          if (s.subcategory) {
            const subs = getSubcategories(s.category);
            const m = subs.find((x) => x.en === s.subcategory || x.ar === s.subcategory);
            if (m) setSubcats([m.en]);
          }
        }
        if (s.condition && CONDITIONS.find((c) => c.id === s.condition)) setCondition(s.condition);
        if (s.description) setDescription(String(s.description).slice(0, 500));
        if (s.price_estimate && !price) setPrice(String(s.price_estimate));
        toast({ title: ar ? "تم تحليل الصور وتعبئة التفاصيل" : "Photos analyzed — details filled in" });
      } else {
        toast({ title: ar ? "لم يتمكن الذكاء الاصطناعي من تحليل الصور" : "AI couldn't analyze the photos", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: ar ? "تعذّر التحليل" : "Couldn't analyze photos", variant: "destructive" });
    }
    setAnalyzing(false);
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
    setSubcats((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };
  const toggleTag = (t) => {
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };
  const tagOptions = getListingTags(category, subcats, condition);

  // Prune selected tags that are no longer valid for the current
  // category / subcategory / condition (e.g. "Sealed" after switching to "good").
  useEffect(() => {
    const valid = new Set(getListingTags(category, subcats, condition).map((o) => o.en));
    setTags((prev) => prev.every((t) => valid.has(t)) ? prev : prev.filter((t) => valid.has(t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcats, condition]);

  const onPriceChange = (e) => setPrice(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 8));

  const submit = async () => {
    if (!title || !price || !category || !city || images.length === 0) return;
    postedRef.current = true;
    setPosting(true);
    try {
      await onSubmit(buildData());
    } catch (e) {
      postedRef.current = false;
      setPosting(false);
    }
  };

  const saveDraft = async () => {
    if (!draftReady || savingDraft) return;
    savedRef.current = true;
    setSavingDraft(true);
    try {
      await onSaveDraft(buildData());
    } catch (e) {
      savedRef.current = false;
    }
    setSavingDraft(false);
  };

  // The REGA license requirement is Saudi-specific; other GCC countries have
  // no such ad-license mandate, so the license section and its validation only
  // apply when the listing's country is Saudi Arabia.
  const saRealEstate = category === "realestate" && country === "SA";
  // Saudi real estate requires a one-time REGA Fal license approved in the
  // user's profile settings. Approved users can post with no per-listing
  // review; the Fal license is copied from their profile into each listing.
  const reApproved = saRealEstate && user?.re_license_status === "approved";
  const reBlocked = saRealEstate && !reApproved;
  // Per-listing ad license fields are required for Saudi real estate.
  const adLicenseValid = !saRealEstate || !reApproved || (
    !!reAdLicense.re_ad_license_number?.trim() &&
    !!reAdLicense.re_ad_license_link?.trim() &&
    !!reAdLicense.re_ad_license_expiry &&
    !!reAdLicense.re_brokerage_contract_number?.trim() &&
    !!reAdLicense.re_title_deed_number?.trim() &&
    !!reAdLicense.re_deed_area?.trim() &&
    !!reAdLicense.re_plan_plot?.trim() &&
    !!reAdLicense.re_title_deed_doc
  );
  const reValid = !saRealEstate || reApproved;
  const valid = title && price && category && city && images.length > 0 && reValid && !reBlocked && adLicenseValid;
  // A draft only needs the core fields (no real-estate ad-license gate) so a
  // seller can save an in-progress listing and finish the REGA details later.
  const draftReady = !!(title && price && category && city && images.length > 0);

  // Assemble the full form payload — shared by Post, Save-draft, and the
  // exit-time auto-save so the three never drift apart.
  const buildData = () => ({
    title,
    price: Number(price),
    images: images.length ? images : ["https://picsum.photos/seed/" + encodeURIComponent(title) + "/600/600"],
    category,
    subcategory: subcats.length ? subcats : undefined,
    condition,
    tags: tags.length ? tags : undefined,
    specs: Object.keys(specs).length ? specs : undefined,
    city,
    location_name: locationName || undefined,
    country: country || "SA",
    lat,
    lng,
    description,
    willing_to_ship: willingToShip,
    shipping_fee: willingToShip && shippingFee ? Number(shippingFee) : null,
    delivers_within_city: deliversWithinCity,
    re_license_type: saRealEstate && reApproved ? user.re_license_type : undefined,
    re_license_number: saRealEstate && reApproved ? user.re_license_number : undefined,
    re_license_holder: saRealEstate && reApproved ? user.re_license_holder : undefined,
    re_license_expiry: saRealEstate && reApproved ? user.re_license_expiry : undefined,
    re_license_doc: saRealEstate && reApproved ? user.re_license_doc : undefined,
    re_establishment_number: saRealEstate && reApproved ? user.re_establishment_number : undefined,
    re_ad_license_number: saRealEstate && reApproved ? reAdLicense.re_ad_license_number?.trim() || undefined : undefined,
    re_ad_license_link: saRealEstate && reApproved ? reAdLicense.re_ad_license_link?.trim() || undefined : undefined,
    re_ad_license_expiry: saRealEstate && reApproved ? reAdLicense.re_ad_license_expiry || undefined : undefined,
    re_deed_area: saRealEstate && reApproved ? reAdLicense.re_deed_area?.trim() || undefined : undefined,
    re_plan_plot: saRealEstate && reApproved ? reAdLicense.re_plan_plot?.trim() || undefined : undefined,
    re_brokerage_contract_number: saRealEstate && reApproved ? reAdLicense.re_brokerage_contract_number?.trim() || undefined : undefined,
    re_title_deed_number: saRealEstate && reApproved ? reAdLicense.re_title_deed_number?.trim() || undefined : undefined,
    re_title_deed_doc: saRealEstate && reApproved ? reAdLicense.re_title_deed_doc || undefined : undefined,
    re_has_mortgage: saRealEstate && reApproved ? !!reAdLicense.re_has_mortgage : false,
    re_mortgage_details: saRealEstate && reApproved && reAdLicense.re_has_mortgage ? reAdLicense.re_mortgage_details?.trim() || undefined : undefined,
    featured: false,
    boost_hours: useFreeBoost ? 0 : boostHours,
    boost_amount: boostAmount,
    claim_free_boost: useFreeBoost,
  });

  // Keep the latest payload in a ref so the unmount cleanup can fire the
  // exit-time draft save with current data (closures in empty-dep effects
  // otherwise capture the first render's stale state). The assignment runs
  // after every render once all derived values (e.g. boostAmount) exist.

  // Exit-time auto-save: if the seller leaves the new-listing form with the
  // core fields filled (and didn't Post or explicitly Save-draft), persist a
  // private draft so their work isn't lost. Only fires for new listings —
  // editing an existing item keeps its own save flow.
  useEffect(() => {
    return () => {
      if (postedRef.current || savedRef.current) return;
      if (initial) return;
      const d = dataRef.current;
      if (!d || !(d.title && d.price && d.category && d.city && (d.images?.length > 0))) return;
      onAutoSaveDraft?.(d);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Featured-listing promotion price: basePrice = 5 + 20·ln(1 + P/500), then
  // × (H/24)^0.70, floored at SAR 5. P is the item price, H the selected hours.
  const existingHours = existingBoostHours(initial?.featured_until);
  const maxBoost = Math.max(0, BOOST_MAX_HOURS - existingHours);
  const itemPrice = Number(price) || 0;
  const boostAmount = boostHours > 0 ? computeBoostPrice(itemPrice, boostHours).amount : 0;
  const cur = getCountry(country || "SA");
  const boostDisplay = convertCurrency(boostAmount, "SA", country || "SA");
  const fmt = (n) => Number(n).toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 2 });
  const subs = category ? getSubcategories(category) : [];

  dataRef.current = buildData();

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold flex items-center gap-0.5">{t("photos")} <span className="text-rose-500">*</span></label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 active:scale-95 transition">
              
              <Camera size={12} /> {ar ? "كاميرا" : "Camera"}
            </button>
            <span className="text-[11px] text-muted-foreground font-medium">{images.length}/{maxPhotos}</span>
          </div>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) =>
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-2">
                {images.map((url, i) =>
              <Draggable key={url} draggableId={url} index={i}>
                    {(prov, snap) =>
                <div
                  ref={prov.innerRef}
                  {...prov.draggableProps}
                  {...prov.dragHandleProps}
                  className={`relative w-24 h-24 rounded-xl overflow-hidden select-none ${snap.isDragging ? "opacity-70 ring-2 ring-primary" : ""}`}>
                  
                        <Image src={url} fittingType="fill" className="w-full h-full pointer-events-none" style={{ display: "block" }} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/25 transition pointer-events-none">
                          <GripVertical size={18} className="text-white opacity-70 drop-shadow" />
                        </div>
                        <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center z-10">
                    
                          <X size={14} />
                        </button>
                        {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">{t("cover")}</span>}
                      </div>
                }
                  </Draggable>
              )}
                {Array.from({ length: Math.max(0, 5 - images.length) }).map((_, j) => {
                const i = images.length + j;
                const isUploading = uploading && j === 0;
                return (
                  <Draggable key={`empty-${i}`} draggableId={`empty-${i}`} index={i} isDragDisabled>
                      {(prov) =>
                    <div ref={prov.innerRef} {...prov.draggableProps} className="w-24 h-24 rounded-xl border-2 border-dashed border-border">
                          <label className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer gap-1">
                            {isUploading ?
                        <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> :

                        <>
                                <ImagePlus size={20} />
                                <span className="text-[10px] font-medium">{t("addPhotos")}</span>
                              </>
                        }
                            <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
                          </label>
                        </div>
                    }
                    </Draggable>);

              })}
                {images.length >= 5 && images.length < maxPhotos &&
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/30 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 cursor-pointer gap-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                    {uploading ?
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> :

                <>
                        <ImagePlus size={20} />
                        <span className="text-[9px] font-semibold text-center px-1 leading-tight">{ar ? "إضافة" : "Add"}</span>
                        <span className="text-[8px] font-medium text-blue-500/80">{ar ? `حتى ${verified ? "٢٠" : "٥"}` : `up to ${verified ? "20" : "5"}`}</span>
                      </>
                }
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
                  </label>
              }
                {images.length >= maxPhotos && verified &&
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center text-blue-400 gap-0.5 opacity-60">
                    <Check size={18} />
                    <span className="text-[9px] font-semibold">{ar ? "الحد الأقصى ٢٠" : "Max 20"}</span>
                  </div>
              }
                {images.length >= maxPhotos && !verified &&
              <button
                type="button"
                onClick={() => setVerifyOpen(true)}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/30 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 gap-1">
                
                    <Lock size={18} />
                    <span className="text-[9px] font-semibold text-center px-1 leading-tight">{ar ? "تحقق لإضافة 15 صور" : "Verify for 15 more"}</span>
                  </button>
              }
                {provided.placeholder}
              </div>
            }
          </Droppable>
        </DragDropContext>
        <p className="text-[11px] text-muted-foreground mt-1.5">{t("dragToReorder")}</p>
        <div className="mt-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${verified ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"}`}>
            <ImagePlus size={12} />
            {verified ?
            ar ? "يمكنك إضافة حتى ٢٠ صورة" : "You can upload up to 20 photos" :
            ar ? "يمكنك إضافة حتى ٥ صور فقط" : "You can upload up to 5 photos only"}
          </span>
        </div>
        {images.length > 0 &&
        <button
          type="button"
          onClick={analyze}
          disabled={analyzing}
          className="mt-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition">
          
            {analyzing ?
          <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {ar ? "جارٍ تحليل الصور…" : "Analyzing photos…"}
              </> :

          <>
                <Wand2 size={16} /> {ar ? "تحليل الصور بالذكاء الاصطناعي" : "AI Analyze Photos"}
              </>
          }
          </button>
        }
        {images.length === 0 &&
        <p className="text-[11px] text-rose-500 font-semibold mt-1">{ar ? "صورة واحدة على الأقل مطلوبة" : "At least one photo is required"}</p>
        }
        {!verified &&
        <button type="button" onClick={() => setVerifyOpen(true)} className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 hover:underline">
            <Lock size={11} /> {ar ? "وثق حسابك لإضافة 15 صور إضافية" : "Verify your account to add 15 more photos"}
          </button>
        }
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold flex items-center gap-0.5">{t("title")} <span className="text-rose-500">*</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 50))} maxLength={50} placeholder={t("titlePlaceholder")} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30" />
        <div className="flex justify-end text-[11px] text-muted-foreground mt-1">{(title || "").length}/50</div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold flex items-center gap-0.5">{t("price")} <span className="text-rose-500">*</span></label>
        <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted ${boostLocked ? "opacity-60" : ""} ${!price ? "ring-1 ring-rose-400" : ""}`}>
          <input value={price} onChange={onPriceChange} placeholder={t("pricePlaceholder")} className="bg-transparent outline-none flex-1 disabled:cursor-not-allowed" inputMode="numeric" />
          <CurrencySymbol country={country || "SA"} lang={lang} size={15} className="text-muted-foreground shrink-0" />
        </div>
        {!price &&
        <p className="text-[11px] text-rose-500 font-semibold hidden">{ar ? "السعر مطلوب" : "Price is required"}</p>
        }
        {boostLocked &&
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Lock size={11} /> {ar ? "يمكن خفض السعر أثناء الترويج فقط" : "Only price decreases are allowed while promoted"}
          </p>
        }
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold flex items-center gap-0.5">{t("category")} <span className="text-rose-500">*</span></label>
        <SheetSelect
          value={category}
          onChange={(v) => {setCategory(v);setSubcats([]);setTags([]);setSpecs({});}}
          placeholder={t("selectCategory")}
          label={t("category")}
          options={CATEGORIES.filter((c) => c.id !== "all").map((c) => ({ value: c.id, label: lang === "ar" ? c.ar : c.en }))} />
        
      </div>

      {subs.length > 0 &&
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
                className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}>
                
                  {lang === "ar" ? s.ar : s.en}
                </button>);

          })}
          </div>
        </div>
      }

      {saRealEstate && (
        <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${reApproved ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30" : "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30"}`}>
          <div className="flex items-start gap-2">
            <ShieldCheck size={18} className={`shrink-0 mt-0.5 ${reApproved ? "text-emerald-600" : "text-rose-600"}`} />
            <div>
              <p className="text-sm font-bold">{reApproved ? (ar ? "ترخيص فال معتمد ✓" : "FAL license approved ✓") : (ar ? "ترخيص فال مطلوب" : "FAL license required")}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {reApproved
                  ? (ar ? "بيانات ترخيص فال خاصتك ستُرفق بهذا الإعلان تلقائياً. أدخل below بيانات ترخيص الإعلان لهذا العقار." : "Your FAL license details will be attached automatically. Enter the ad license details for this property below.")
                  : (ar ? "أضف ترخيص الوساطة العقارية (فال) من ملفك الشخصي مرة واحدة لتتمكن من نشر إعلانات عقارية." : "Add your FAL broker license once in your profile settings to post real estate listings.")}
              </p>
            </div>
          </div>
          {!reApproved && (
            <button type="button" onClick={() => nav("/profile")} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              {ar ? "إضافة الترخيص من الملف الشخصي" : "Add license from profile"}
            </button>
          )}
        </div>
      )}

      {/* Per-listing REGA ad license — only for approved Saudi real estate brokers */}
      {saRealEstate && reApproved && (
        <RealEstateAdLicenseFields value={reAdLicense} onChange={setReAdLicense} />
      )}

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("selectCondition")}</label>
        <SheetSelect
          value={condition}
          onChange={setCondition}
          label={t("selectCondition")}
          buttonClassName="border-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300/40"
          options={CONDITIONS.map((c) => ({ value: c.id, label: lang === "ar" ? c.ar : c.en }))} />
        
      </div>

      {getSpecFields(category).length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "المواصفات" : "Specifications"}</label>
          <div className="grid grid-cols-2 gap-2">
            {getSpecFields(category).map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{ar ? f.ar : f.en}</label>
                {f.type === "select" ? (
                  <SheetSelect
                    value={specs[f.key] || ""}
                    onChange={(v) => setSpecs((s) => ({ ...s, [f.key]: v }))}
                    label={ar ? f.ar : f.en}
                    placeholder={ar ? f.ar : f.en}
                    options={(f.options || []).map((o) => ({ value: o.value, label: ar ? o.ar : o.en }))} />
                ) : (
                  <input
                    value={specs[f.key] || ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = f.type === "number" ? normalizeDigits(raw).replace(/[^\d.]/g, "").slice(0, 12) : raw.slice(0, 60);
                      setSpecs((s) => ({ ...s, [f.key]: val }));
                    }}
                    placeholder={f.placeholder || (ar ? f.ar : f.en)}
                    inputMode={f.type === "number" ? "numeric" : "text"}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm" />
                )}
                {f.hint && <p className="text-[10px] text-muted-foreground leading-tight">{ar ? f.hint.ar : f.hint.en}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tagOptions.length > 0 &&
      <div className="space-y-1">
          <label className="text-sm font-semibold">{ar ? "تفاصيل سريعة" : "Quick details"}</label>
          <p className="text-[11px] text-muted-foreground -mt-0.5">{ar ? "اختر ما ينطبق على منتجك ليظهر للمشترين" : "Pick what applies — buyers will see these"}</p>
          <ReviewTagChips options={tagOptions} selected={tags} onToggle={toggleTag} lang={lang} />
        </div>
      }

      <div className="space-y-1">
        <label className="text-sm font-semibold">{t("description")}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} maxLength={500} placeholder={t("descriptionPlaceholder")} rows={4} className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 ring-primary/30 resize-none" />
        <div className="flex justify-end text-[11px] text-muted-foreground">{(description || "").length}/500</div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold flex items-center gap-0.5">{t("location")} <span className="text-rose-500">*</span></label>
        <div className={`rounded-2xl bg-muted p-3 space-y-2.5 ${lat != null && lng != null ? "ring-2 ring-emerald-500/50 border border-emerald-500/40" : ""}`}>
          <div className="flex items-center gap-2">
            <MapPin size={16} className={`${lat != null && lng != null ? "text-emerald-600" : "text-muted-foreground"} shrink-0`} />
            <SheetSelect
              value={city}
              onChange={(v) => {
                setCity(v);
                setLocationName("");
                const c = getCities(country || "SA").find((x) => x.en === v);
                if (c) {setLat(c.lat);setLng(c.lng);}
              }}
              placeholder={t("selectCity")}
              label={t("location")}
              buttonClassName="bg-transparent px-0 py-1.5 text-sm font-semibold flex-1"
              options={getCities(country || "SA").map((c) => ({ value: c.en, label: lang === "ar" ? c.ar : c.en }))} />
            
          </div>
          {lat != null && lng != null &&
          <div className="ps-6 space-y-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-bold">
              <Check size={11} /> {ar ? "تم تحديد موقعك" : "Location set"}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {locationName ? <span className="font-semibold text-foreground">{locationName}</span> : (ar ? "الإحداثيات" : "Coordinates") + ": "}
              {!locationName ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : ""}
            </p>
          </div>
          }
          <div className="flex gap-2">
            <button type="button" onClick={detectLocation} disabled={locating} className="flex-1 py-2.5 rounded-xl bg-card border border-border/60 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
              {locating ? <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> : <LocateFixed size={14} />} {t("useMyLocation")}
            </button>
            <button type="button" onClick={() => {setMapPos(lat != null && lng != null ? { lat, lng } : null);setMapOpen(true);}} className="flex-1 py-2.5 rounded-xl bg-card border border-border/60 text-xs font-semibold flex items-center justify-center gap-1.5">
              <Globe size={14} /> {ar ? "اختر على الخريطة" : "Select on map"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2.5">
          <Truck size={18} className="text-emerald-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{t("shippingOptions")}</p>
            <p className="text-xs text-muted-foreground">{ar ? "وسّع نطاق وصولك Beyond the local meet-up" : "Reach buyers beyond a face-to-face meet-up"}</p>
          </div>
        </div>
        <label className="flex items-center justify-between p-3 rounded-xl bg-muted">
          <span className="text-sm font-semibold flex items-center gap-2"><Truck size={15} /> {t("willingToShip")}</span>
          <button type="button" onClick={() => setWillingToShip(!willingToShip)} className={`w-11 h-6 rounded-full p-0.5 transition ${willingToShip ? "bg-emerald-500" : "bg-muted-foreground/30"}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${willingToShip ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
          </button>
        </label>
        {willingToShip &&
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted">
            <input value={shippingFee} onChange={(e) => setShippingFee(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 6))} placeholder={t("shippingFeePh")} inputMode="numeric" className="bg-transparent outline-none flex-1" />
            <CurrencySymbol country={country || "SA"} lang={lang} size={15} className="text-muted-foreground shrink-0" />
          </div>
        }
        <label className="flex items-center justify-between p-3 rounded-xl bg-muted">
          <span className="text-sm font-semibold flex items-center gap-2"><MapPin size={15} /> {t("deliversWithinCity")}</span>
          <button type="button" onClick={() => setDeliversWithinCity(!deliversWithinCity)} className={`w-11 h-6 rounded-full p-0.5 transition ${deliversWithinCity ? "bg-emerald-500" : "bg-muted-foreground/30"}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${deliversWithinCity ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
          </button>
        </label>
      </div>

      <div className="p-3.5 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles size={18} className="text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{t("promoteListing")}</p>
            <p className="text-xs text-muted-foreground">{ar ? "تعزيز الإعلان ليظهر في المميز" : "Boost your listing to appear in featured"}</p>
          </div>
        </div>
        {boostLocked &&
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {ar ? "هذا الإعلان مُعزَّز حالياً — لا يمكن تعديل الترويج من هنا" : "This listing is currently promoted — promotion can't be modified here"}
              {initial?.featured_until &&
            <>
                  {" · "}
                  {ar ? "ينتهي في " : "Ends "}
                  {new Date(initial.featured_until).toLocaleString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {ar ? "يمكنك طلب تعزيز جديد بعد انتهائه" : "you can request a new boost after it ends"}
                </>
            }
            </p>
          </div>
        }
        {/* Free 1-day boost reward for verified users (one per user, enforced server-side) */}
        {verified && freeBoostAvailable && !boostLocked && (
          <button
            type="button"
            onClick={() => { setUseFreeBoost((v) => !v); if (!useFreeBoost) setBoostHours(0); }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${useFreeBoost ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800" : "bg-muted border-dashed border-emerald-300 dark:border-emerald-800/60"}`}>
            <span className="flex items-center gap-2 text-start">
              <Gift size={16} className="text-emerald-600" />
              <span>
                <span className="text-sm font-semibold block">{ar ? "تعزيز مجاني ليوم واحد" : "Free 1-day boost"}</span>
                <span className="text-[11px] text-muted-foreground">{ar ? "مكافأة التوثيق — تُفعَّل فور النشر" : "Verification reward — activates on post"}</span>
              </span>
            </span>
            <span className={`w-11 h-6 rounded-full p-0.5 transition ${useFreeBoost ? "bg-emerald-500" : "bg-muted-foreground/30"}`}>
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${useFreeBoost ? "translate-x-5 rtl:-translate-x-5" : ""}`} />
            </span>
          </button>
        )}
        {verified && freeBoostAvailable === false && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Check size={12} className="text-emerald-600" /> {ar ? "لقد استخدمت تعزيزك المجاني." : "You've used your free boost."}</p>
        )}
        {!verified && (
          <button type="button" onClick={() => setVerifyOpen(true)} className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-start">
            <Lock size={15} className="text-sky-600 shrink-0" />
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">{ar ? "وثّق حسابك لتحصل على تعزيز مجاني ليوم واحد" : "Verify your account to unlock a free 1-day boost"}</span>
          </button>
        )}
        <div className={(boostLocked || useFreeBoost) ? "opacity-50 pointer-events-none" : ""}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-semibold">{ar ? "المدة المضافة" : "Hours to add"}</span>
            <span className="font-bold">{boostHours > 0 ? (() => {const days = boostHours / 24;const dayLabel = days >= 1 && boostHours % 24 === 0 ? ` (${days} ${ar ? days === 1 ? "يوم" : days === 2 ? "يومان" : days <= 10 ? "أيام" : "يوم" : days === 1 ? "day" : "days"})` : "";return `${boostHours} ${ar ? "ساعة" : "h"}${dayLabel}`;})() : ar ? "بدون تعزيز" : "No boost"}</span>
          </div>
          {existingHours > 0 &&
          <p className="text-[11px] text-muted-foreground mb-1.5">
              {ar ? `تعزيز حالي: ${existingHours} ساعة متبقية` : `Current boost: ${existingHours}h remaining`}
            </p>
          }
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
            className="w-full accent-amber-500 disabled:opacity-50" />
          
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span>{maxBoost}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const hrs = d * 24;
              if (hrs > maxBoost) return null;
              const label = d === 7 ? ar ? "أسبوع" : "1 Week" : d === 1 ? ar ? "يوم" : "1 Day" : d === 2 ? ar ? "يومان" : "2 Days" : ar ? `${d} أيام` : `${d} Days`;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setBoostHours(hrs)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${boostHours === hrs ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                  
                  {label}
                </button>);

            })}
          </div>
          {maxBoost === 0 &&
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">{ar ? "وصلت للحد الأقصى (أسبوع واحد)" : "Max boost reached (1 week)"}</p>
          }
          {boostHours > 0 &&
          <div className="mt-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">{ar ? "الإجمالي بعد التعزيز" : "Total after boost"}</span>
                <span className="font-semibold">{fmt(boostDisplay)} {ar ? cur.currencyAr : cur.currency}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{ar ? <>سيظهر إعلانك في قسم المميز طوال هذه المدة لجميع المدن في دولتك {cur.flag}</> : <>Your listing will appear in the Featured section for this duration across all cities in your country {cur.flag}</>}</p>
            </div>
          }
        </div>
        {boostHours > 0 &&
        <>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{ar ? "الإجمالي" : "Total"}</span>
              <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{fmt(boostDisplay)} {ar ? cur.currencyAr : cur.currency}</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50">
              <p className="text-xs text-muted-foreground">{ar ? "سيتم تفعيل التعزيز فور إتمام الدفع عبر بوابة الدفع الإلكترونية." : "The boost activates instantly once payment is completed."}</p>
            </div>
          </>
        }
      </div>

      {isDraft && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-2">
          <FileText size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">{t("draftHint")}</p>
        </div>
      )}

      <div className="flex gap-2.5">
        {onSaveDraft && (
          <button
            onClick={saveDraft}
            disabled={!draftReady || savingDraft || posting}
            className="flex-1 py-4 rounded-2xl bg-card border-2 border-border text-foreground font-bold text-sm disabled:opacity-50 hover:bg-muted transition flex items-center justify-center gap-1.5"
          >
            {savingDraft ? t("savingDraft") : (<><FileText size={16} /> {t("saveDraft")}</>)}
          </button>
        )}
        <button
          onClick={submit}
          disabled={!valid || posting}
          className={`${onSaveDraft ? "flex-[1.4]" : "flex-1"} py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg disabled:opacity-50 hover:bg-emerald-700 active:scale-[0.99] transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5`}
        >
          {posting ? submittingLabel : (isDraft ? t("publish") : submitLabel)}
        </button>
      </div>

      {mapOpen &&
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMapOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-[100%] duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{ar ? "اختر موقع الإعلان" : "Pick listing location"}</h3>
              <button onClick={() => setMapOpen(false)} className="p-1.5 rounded-full hover:bg-muted"><X size={20} /></button>
            </div>
            <MapPinPicker
            center={mapPos || getCities(country || "SA")[0] || { lat: 24.7136, lng: 46.6753 }}
            radius={0}
            onPick={(p) => setMapPos(p)} />
          
            {mapPos &&
          <p className="text-xs text-muted-foreground mt-2">
                {ar ? "الموقع" : "Location"}: {mapPos.lat.toFixed(4)}, {mapPos.lng.toFixed(4)}
                {mapHint ? ` · ${mapHint}` : ""}
              </p>
          }
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
            className="mt-4 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            
              {t("apply")}
            </button>
          </div>
        </div>
      }

      {cameraOpen &&
      <CameraCapture
        lang={lang}
        max={Math.max(1, maxPhotos - images.length)}
        onDone={onCameraDone}
        onClose={() => setCameraOpen(false)} />

      }

      {editQueue.length > 0 &&
      <ImageEditor
        files={editQueue}
        lang={lang}
        onFileDone={handleFileDone}
        onSkipFile={handleSkipFile} />

      }

      <VerificationDialog open={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </div>);

}