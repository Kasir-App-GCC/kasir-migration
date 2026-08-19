import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, Check, X, Sparkles, ShoppingBag, Map as MapIcon, Sun, Clock, ArrowLeftRight, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import ItemCard from "@/components/ItemCard";
import TrustedBadge from "@/components/TrustedBadge";
import { COUNTRIES } from "@/lib/countries";
import { useNavigate } from "react-router-dom";

const SCENES = 5;
const DURATIONS = [2500, 2500, 4000, 3500, 2500];

const SELL_PHOTOS = [
  "https://media.base44.com/images/public/6a81368f876e0b385d3684d3/808035172_generated_image.png",
  "https://media.base44.com/images/public/6a81368f876e0b385d3684d3/12e104a16_generated_image.png",
];

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

  const grid = useMemo(() => items.slice(0, 8), [items]);

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
          {scene === 0 && <SceneCountry ar={ar} />}
          {scene === 1 && <SceneHome ar={ar} items={grid} />}
          {scene === 2 && <SceneSell ar={ar} />}
          {scene === 3 && <SceneOffer ar={ar} />}
          {scene === 4 && <SceneCTA ar={ar} />}
        </motion.div>
      </AnimatePresence>

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
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf;
    const start = performance.now();
    const dur = 2000;
    const max = () => Math.max(0, el.scrollHeight - el.clientHeight);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      el.scrollTop = eased * max();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items]);
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
      <div className="flex-1 overflow-hidden p-4 space-y-4 flex flex-col">
        <div className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ShoppingBag size={20} /></div>
          <div className="flex-1 text-start">
            <p className="font-bold text-sm leading-tight">{ar ? "مساعد التسوق الذكي" : "AI Shopping Assistant"}</p>
            <p className="text-xs text-white/80 leading-tight mt-0.5">{ar ? "اوصف اللي تبيه وأساعدك تلاقيه" : "Describe what you need and I'll find it"}</p>
          </div>
          <Sparkles size={18} />
        </div>
        <div className="flex items-baseline justify-between shrink-0">
          <h2 className="font-bold text-lg">{ar ? "أُضيف حديثاً" : "Added recently"}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{items.length} {ar ? "إعلان" : "items"}</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-sm font-semibold"><MapIcon size={16} /> {ar ? "الخريطة" : "Map"}</span>
          </div>
        </div>
        <div ref={scrollRef} className="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar flex-1 content-start">
          {(items.length ? items : Array.from({ length: 8 })).map((it, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
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

function SceneOffer({ ar }) {
  const [accepted, setAccepted] = useState(false);
  const [meet, setMeet] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setAccepted(true), 1600);
    const t2 = setTimeout(() => setMeet(true), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
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
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start">
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
              <span className="line-through">﷼ 200</span>
              <span>· {ar ? "السعر الأصلي" : "Original"}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-2 bg-amber-100/70 dark:bg-amber-950/40 rounded-xl">
              <Tag size={15} className="text-amber-600" />
              <span className="text-lg font-extrabold">﷼ 140</span>
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
          </div>
        </motion.div>

        <AnimatePresence>
          {meet && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
              <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground rounded-br-sm text-sm">{ar ? "وين نلتقي؟" : "Where do we meet?"}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {meet && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex justify-start">
              <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-muted rounded-bl-sm text-sm">{ar ? "شارع العليا، الرياض الساعة ٦" : "Olaya St, Riyadh — 6pm"}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SceneSell({ ar }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const conds = ar
    ? [{ id: "new", label: "جديد" }, { id: "like_new", label: "مثل جديد" }, { id: "good", label: "جيد" }, { id: "fair", label: "مقبول" }]
    : [{ id: "new", label: "New" }, { id: "like_new", label: "Like new" }, { id: "good", label: "Good" }, { id: "fair", label: "Fair" }];
  const picked = "good";
  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <div className="px-4 pt-4 pb-2"><h1 className="text-2xl font-extrabold">{ar ? "بِع" : "Sell"}</h1></div>
      <div className="flex-1 overflow-hidden p-4 space-y-3.5 max-w-sm mx-auto w-full">
        <div className="flex gap-2">
          {SELL_PHOTOS.map((p, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden flex-1 relative bg-muted">
              <motion.img initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }} src={p} className="w-full h-full object-cover" />
              {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">{ar ? "الغلاف" : "Cover"}</span>}
            </div>
          ))}
          <div className="aspect-square rounded-xl border-2 border-dashed border-border flex-1" />
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 1 ? 1 : 0.4, y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4">
          <span className="text-sm font-semibold">{step >= 1 ? (ar ? "آيفون 12 مستعمل" : "Used iPhone 12") : (ar ? "العنوان" : "Title")}</span>
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 1 ? 1 : 0.4, y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-muted-foreground">{ar ? "السعر" : "Price"}</span>
            {step >= 1 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-600 font-extrabold">﷼ 200</motion.span>}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 1 ? 1 : 0.4, y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-muted-foreground">{ar ? "الحالة" : "Condition"}</span>
            {step >= 1 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-sm">{ar ? "جيد" : "Good"}</motion.span>}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 1 : 0 }} className="flex flex-wrap gap-2">
          {conds.map((c) => (
            <span key={c.id} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c.id === picked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{c.label}</span>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 1 ? 1 : 0.4, y: 0 }} className="h-12 rounded-2xl bg-muted flex items-center px-4">
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
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12 }} className="w-20 h-20 rounded-3xl bg-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
        <Tag size={40} className="text-slate-900 -rotate-12" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-7xl font-extrabold text-white drop-shadow-xl">{ar ? "كاسر" : "Kasir"}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/80 text-lg font-semibold mt-3">{ar ? "سوقك الرقمي في الخليج" : "Your digital GCC marketplace"}</motion.p>
      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} onClick={() => navigate("/")} className="mt-8 bg-amber-500 text-slate-900 font-extrabold px-9 py-4 rounded-2xl text-xl shadow-2xl shadow-amber-500/30 flex items-center gap-2 active:scale-95 transition">
        <Download size={22} />
        {ar ? "حمّل كاسر الآن" : "Get Kasir now"}
      </motion.button>
    </div>
  );
}