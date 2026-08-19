import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, Crosshair, Check, X, Camera, Sparkles, ShoppingBag, Map as MapIcon, Sun, Clock, ArrowLeftRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import ItemCard from "@/components/ItemCard";
import TrustedBadge from "@/components/TrustedBadge";
import { COUNTRIES } from "@/lib/countries";

const SCENES = 6;
const DURATIONS = [2500, 2500, 3000, 3500, 4000, 2500];

const CAPTIONS = [
  { ar: "تصفّح آلاف الإعلانات حولك", en: "Browse thousands of listings around you" },
  { ar: "اختر دولتك — السعودية", en: "Pick your country — Saudi Arabia" },
  { ar: "اعثر على عروض قربك", en: "Find deals near you" },
  { ar: "أرسل عرضك — وتم القبول", en: "Send an offer — accepted!" },
  { ar: "بِع في دقائق — صوّر وانشر", en: "Sell in minutes — snap and post" },
  { ar: "كاسر — سوقك المحلي في الخليج", en: "Kasir — your local GCC marketplace" },
];

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&q=80";

export default function AdReel() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const [scene, setScene] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.Item.list("-created_date", 8).then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setScene((s) => (s + 1) % SCENES), DURATIONS[scene]);
    return () => clearTimeout(id);
  }, [scene]);

  const grid = useMemo(() => items.slice(0, 4), [items]);
  const sellPhoto = useMemo(() => items[0]?.images?.[0] || FALLBACK_PHOTO, [items]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col select-none" dir={ar ? "rtl" : "ltr"}>
      <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 z-50">
        <motion.div key={scene} className="h-full bg-amber-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: DURATIONS[scene] / 1000, ease: "linear" }} />
      </div>
      <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 z-50">
        {Array.from({ length: SCENES }).map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === scene ? "w-5 bg-amber-500" : "w-1.5 bg-foreground/30"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={scene} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45 }} className="flex-1 relative">
          {scene === 0 && <SceneHome ar={ar} items={grid} />}
          {scene === 1 && <SceneCountry ar={ar} />}
          {scene === 2 && <SceneNearby ar={ar} />}
          {scene === 3 && <SceneOffer ar={ar} />}
          {scene === 4 && <SceneSell ar={ar} photo={sellPhoto} />}
          {scene === 5 && <SceneCTA ar={ar} />}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none z-30" />
      <div className="absolute bottom-0 inset-x-0 z-40 p-5 pb-7 text-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.p key={scene} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }} className="text-white text-xl font-extrabold drop-shadow-lg">
            {CAPTIONS[scene][ar ? "ar" : "en"]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BrandMark({ ar }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm"><Tag size={18} className="-rotate-12" /></div>
      <span className="font-extrabold text-lg tracking-tight">{ar ? "كاسر" : "Kasir"}</span>
    </div>
  );
}

function SceneHome({ ar, items }) {
  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <header className="bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="px-4 h-14 flex items-center gap-3">
          <BrandMark ar={ar} />
          <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-sm font-medium min-w-0">
            <span className="shrink-0">📍</span>
            <span className="truncate">{ar ? "كل المدن" : "All cities"}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg">🇸🇦</div>
            <div className="px-3 py-2 rounded-xl bg-muted text-sm font-bold">{ar ? "EN" : "ع"}</div>
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><Sun size={18} /></div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        <div className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ShoppingBag size={20} /></div>
          <div className="flex-1 text-start">
            <p className="font-bold text-sm leading-tight">{ar ? "مساعد التسوق الذكي" : "AI Shopping Assistant"}</p>
            <p className="text-xs text-white/80 leading-tight mt-0.5">{ar ? "اوصف اللي تبيه وأساعدك تلاقيه" : "Describe what you need and I'll find it"}</p>
          </div>
          <Sparkles size={18} />
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold text-lg">{ar ? "وصل حديثاً" : "New arrivals"}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{items.length} {ar ? "إعلان" : "items"}</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold"><MapIcon size={16} /> {ar ? "الخريطة" : "Map"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(items.length ? items : Array.from({ length: 4 })).map((it, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
              {items.length ? <ItemCard item={it} onClick={() => {}} /> : <div className="aspect-square rounded-2xl bg-muted" />}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneCountry({ ar }) {
  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <header className="border-b border-border/60">
        <div className="px-4 h-14 flex items-center gap-3">
          <BrandMark ar={ar} />
          <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-sm"><span>📍</span><span className="truncate">{ar ? "كل المدن" : "All cities"}</span></div>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg ring-2 ring-primary">🇸🇦</div>
            <div className="absolute end-0 mt-1 z-50 w-44 rounded-2xl bg-background border border-border shadow-xl py-1">
              {COUNTRIES.map((c) => (
                <div key={c.code} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-start ${c.code === "SA" ? "bg-primary/10 font-bold text-primary" : ""}`}>
                  <span className="text-lg">{c.flag}</span>
                  <span>{ar ? c.ar : c.en}</span>
                  {c.code === "SA" && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 300 }} className="ms-auto"><Check size={16} /></motion.span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 12 }} className="text-center">
          <div className="text-8xl mb-4">🇸🇦</div>
          <p className="text-2xl font-extrabold">{ar ? "السعودية" : "Saudi Arabia"}</p>
          <p className="text-muted-foreground text-sm mt-1">{ar ? "تم اختيار دولتك" : "Your country is set"}</p>
        </motion.div>
      </div>
    </div>
  );
}

function SceneNearby({ ar }) {
  const [radius, setRadius] = useState(5);
  useEffect(() => {
    const id = setTimeout(() => setRadius(10), 1500);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <header className="border-b border-border/60">
        <div className="px-4 h-14 flex items-center gap-3">
          <BrandMark ar={ar} />
          <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-sm"><span>📍</span><span className="truncate">{ar ? "الرياض" : "Riyadh"}</span></div>
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg">🇸🇦</div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden p-3">
        <div className="rounded-3xl bg-background border border-border shadow-xl flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-lg">{ar ? "تصفية الموقع" : "Location filter"}</h3>
            <div className="p-1.5 rounded-full bg-muted"><X size={20} /></div>
          </div>
          <div className="flex gap-1 p-3">
            <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground text-center">{ar ? "المدينة" : "City"}</div>
            <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground text-center">{ar ? "قريب مني" : "Near me"}</div>
            <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground text-center">{ar ? "الخريطة" : "Map"}</div>
          </div>
          <div className="flex-1 px-4 pb-2 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Crosshair size={22} /></div>
              <div>
                <p className="font-semibold">{ar ? "قريب مني" : "Near me"}</p>
                <p className="text-xs text-muted-foreground">{ar ? "تم تحديد موقعك: الرياض" : "Location found: Riyadh"}</p>
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-muted-foreground">{ar ? "نطاق البحث" : "Radius"}</span>
              <span className="text-2xl font-extrabold">{radius} <span className="text-sm font-medium text-muted-foreground">{ar ? "كم" : "km"}</span></span>
            </div>
            <input type="range" min={1} max={200} value={radius} onChange={() => {}} className="w-full accent-primary" />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1"><span>1 {ar ? "كم" : "km"}</span><span>200 {ar ? "كم" : "km"}</span></div>
            <div className="flex flex-wrap gap-2 mt-4">
              {[1, 5, 10, 15, 20, 50, 100].map((km) => (
                <span key={km} className={`px-3 py-1.5 rounded-full text-xs font-bold ${radius === km ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{km} {ar ? "كم" : "km"}</span>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <div className="px-4 py-3 rounded-xl text-sm font-semibold bg-muted text-muted-foreground">{ar ? "مسح" : "Clear"}</div>
            <div className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground text-center">{ar ? "تطبيق" : "Apply"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneOffer({ ar }) {
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setAccepted(true), 1800);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="absolute inset-0 bg-background flex flex-col p-4 pt-12 max-w-sm mx-auto w-full">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">A</div>
        <div>
          <div className="flex items-center gap-1"><span className="font-semibold text-sm">Abdullah</span><TrustedBadge size={13} /></div>
          <span className="text-[11px] text-muted-foreground">{ar ? "متصل الآن" : "Online"}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 py-5">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-muted rounded-bl-sm text-sm">{ar ? "السلام، متوفر؟" : "Hi, is this available?"}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex justify-end">
          <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground rounded-br-sm text-sm">{ar ? "نعم، متوفر" : "Yes, it is"}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }} className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl border-2 border-border/60 bg-card rounded-bl-md p-3 w-[230px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground">{ar ? "عرضك" : "Your offer"}</span>
              {accepted ? (
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={13} /> {ar ? "تم القبول" : "Accepted"}</motion.span>
              ) : (
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock size={13} /> {ar ? "بانتظار الرد" : "Pending"}</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <span className="line-through">﷼ 2,800</span>
              <span>· {ar ? "السعر الأصلي" : "Original"}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-2 bg-amber-100/70 dark:bg-amber-950/40 rounded-xl">
              <Tag size={15} className="text-amber-600" />
              <span className="text-lg font-extrabold">﷼ 2,400</span>
            </div>
            <AnimatePresence>
              {!accepted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-3 gap-1.5 mt-2.5 overflow-hidden">
                  <div className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1"><Check size={13} /> {ar ? "قبول" : "Accept"}</div>
                  <div className="py-2 rounded-xl bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1"><X size={13} /> {ar ? "رفض" : "Reject"}</div>
                  <div className="py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1"><ArrowLeftRight size={13} /> {ar ? "مقايضة" : "Counter"}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {accepted && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-center text-muted-foreground mt-2">{ar ? "تم الاتفاق — رتّبوا الاستلام" : "Agreed — arrange pickup"}</motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SceneSell({ ar, photo }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const filled = (d) => (step >= 1 ? 1 : 0.4);
  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <div className="px-4 pt-4 pb-2"><h1 className="text-2xl font-extrabold">{ar ? "بِع" : "Sell"}</h1></div>
      <div className="flex-1 overflow-hidden p-4 space-y-3.5 max-w-sm mx-auto w-full">
        <div className="flex gap-2">
          <div className="aspect-square rounded-xl overflow-hidden flex-1 relative bg-muted border-2 border-dashed border-border">
            {photo && <motion.img initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: step >= 0 ? 1 : 0, scale: 1 }} src={photo} className="w-full h-full object-cover" />}
            {step === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><Camera size={20} className="text-slate-900" /></div>
              </motion.div>
            )}
            {step >= 1 && <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">{ar ? "الغلاف" : "Cover"}</span>}
          </div>
          <div className="aspect-square rounded-xl border-2 border-dashed border-border flex-1" />
          <div className="aspect-square rounded-xl border-2 border-dashed border-border flex-1" />
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: filled(), y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4">
          <span className="text-sm font-semibold">{step >= 1 ? (ar ? "آيفون ١٤ مستعمل" : "Used iPhone 14") : (ar ? "العنوان" : "Title")}</span>
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: filled(), y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-muted-foreground">{ar ? "السعر" : "Price"}</span>
            {step >= 1 && <span className="text-amber-600 font-extrabold">﷼ 2,200</span>}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: filled(), y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4">
            <span className="text-sm font-semibold text-muted-foreground">{ar ? "ممتاز" : "Excellent"}</span>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: filled(), y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4">
          <span className="text-sm font-semibold text-muted-foreground">{ar ? "الرياض" : "Riyadh"}</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`w-full py-4 rounded-2xl font-bold text-lg text-center ${step >= 2 ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"}`}>
          {step >= 2 ? (ar ? "تم النشر ✓" : "Posted ✓") : (ar ? "نشر الإعلان" : "Post listing")}
        </motion.div>
      </div>
      {step >= 2 && (
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-24 inset-x-4 mx-auto max-w-sm bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-2.5 z-50">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={18} /></div>
          <div><p className="font-bold text-sm">{ar ? "تم نشر إعلانك" : "Listing posted"}</p><p className="text-xs text-muted-foreground">{ar ? "ظهر في النتائج فوراً" : "Live in results instantly"}</p></div>
        </motion.div>
      )}
    </div>
  );
}

function SceneCTA({ ar }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: -3, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12 }} className="bg-white text-amber-600 px-5 py-2.5 rounded-lg shadow-2xl rotate-[-3deg] mb-7"><span className="text-3xl font-extrabold">﷼ 1,200</span></motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-7xl font-extrabold text-white drop-shadow-xl">{ar ? "كاسر" : "Kasir"}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/90 text-lg font-semibold mt-3">{ar ? "سوقك المحلي في الخليج" : "Your local GCC marketplace"}</motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="mt-8 bg-white text-slate-900 font-extrabold px-9 py-4 rounded-2xl text-xl shadow-2xl">{ar ? "حمّل كاسر الآن" : "Get Kasir now"}</motion.div>
    </div>
  );
}