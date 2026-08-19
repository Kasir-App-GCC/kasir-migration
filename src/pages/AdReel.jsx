import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, MapPin, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import ItemCard from "@/components/ItemCard";
import TrustedBadge from "@/components/TrustedBadge";

const SCENES = 6;
const DURATION = 2500;

const CAPTIONS = [
  { ar: "كاسر — سوقك المحلي", en: "Kasir — your local marketplace" },
  { ar: "تصفّح آلاف الإعلانات", en: "Browse thousands of listings" },
  { ar: "صوّر، انشر، بِع", en: "Snap, post, sell" },
  { ar: "تحاوِر وفاوضض بثقة", en: "Chat & negotiate with confidence" },
  { ar: "بائعون موثوقون قربك", en: "Verified sellers near you" },
  { ar: "عزّز إعلانك في كل الخليج", en: "Boost across the GCC" },
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
    const id = setInterval(() => setScene((s) => (s + 1) % SCENES), DURATION);
    return () => clearInterval(id);
  }, []);

  const grid = useMemo(() => items.slice(0, 4), [items]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col select-none" dir={ar ? "rtl" : "ltr"}>
      <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 z-50">
        <motion.div key={scene} className="h-full bg-amber-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: DURATION / 1000, ease: "linear" }} />
      </div>
      <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 z-50">
        {Array.from({ length: SCENES }).map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === scene ? "w-5 bg-amber-500" : "w-1.5 bg-foreground/30"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={scene} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45 }} className="flex-1 relative">
          {scene === 0 && <SceneBrand ar={ar} />}
          {scene === 1 && <SceneBrowse ar={ar} items={grid} />}
          {scene === 2 && <SceneSell ar={ar} />}
          {scene === 3 && <SceneChat ar={ar} />}
          {scene === 4 && <SceneMap ar={ar} />}
          {scene === 5 && <SceneBoost ar={ar} />}
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

function SceneBrand({ ar }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500">
      <motion.div initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: -3, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12 }} className="bg-white text-amber-600 px-5 py-2.5 rounded-lg shadow-2xl rotate-[-3deg] mb-7">
        <span className="text-3xl font-extrabold">﷼ 1,200</span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-7xl font-extrabold text-white drop-shadow-xl tracking-tight">{ar ? "كاسر" : "Kasir"}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/90 text-lg font-semibold mt-3">{ar ? "سوقك المحلي في الخليج" : "Your local GCC marketplace"}</motion.p>
    </div>
  );
}

function SceneBrowse({ ar, items }) {
  return (
    <div className="absolute inset-0 bg-background p-4 pt-12 pb-24">
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {(items.length ? items : Array.from({ length: 4 })).map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
            {items.length ? <ItemCard item={it} onClick={() => {}} /> : <div className="aspect-square rounded-2xl bg-muted" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SceneSell({ ar }) {
  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="aspect-video rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center">
          <div className="text-center">
            <Camera className="mx-auto text-muted-foreground" size={40} />
            <span className="text-sm font-semibold text-muted-foreground block mt-2">{ar ? "صوّر المنتج" : "Snap a photo"}</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="h-12 rounded-2xl bg-muted flex items-center px-4">
          <span className="text-sm font-semibold text-muted-foreground">{ar ? "عنوان الإعلان" : "Listing title"}</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="h-12 rounded-2xl bg-muted flex items-center px-4 justify-between">
          <span className="text-sm font-semibold text-muted-foreground">{ar ? "السعر" : "Price"}</span>
          <span className="text-amber-600 font-extrabold">﷼ 850</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {ar ? "نشر الإعلان" : "Post listing"}
        </motion.div>
      </div>
    </div>
  );
}

function SceneChat({ ar }) {
  const bubbles = [
    { me: false, text: ar ? "السلام، هل لا يزال متوفر؟" : "Hi, is it still available?" },
    { me: true, text: ar ? "نعم متوفر" : "Yes, available" },
    { me: false, text: ar ? "أعطيك ٢٬٤٠٠" : "I'll offer 2,400" },
  ];
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
        {bubbles.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.35 }} className={`flex ${b.me ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${b.me ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>{b.text}</div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.25 }} className="flex justify-center pt-1">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="text-center"><div className="text-[10px] text-muted-foreground">{ar ? "عرض" : "Offer"}</div><div className="font-extrabold text-amber-600 text-lg">﷼ 2,400</div></div>
            <div className="flex gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold">{ar ? "قبول" : "Accept"}</span>
              <span className="px-3.5 py-1.5 rounded-full bg-muted text-xs font-bold">{ar ? "مقايضة" : "Counter"}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SceneMap({ ar }) {
  const pins = [
    { top: "32%", left: "42%", delay: 0 },
    { top: "56%", left: "66%", delay: 0.3 },
    { top: "42%", left: "26%", delay: 0.6 },
    { top: "66%", left: "52%", delay: 0.9 },
  ];
  return (
    <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      {pins.map((p, i) => (
        <motion.div key={i} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: p.delay, type: "spring", stiffness: 200, damping: 12 }} style={{ top: p.top, left: p.left }} className="absolute -translate-x-1/2 -translate-y-full">
          <MapPin className="text-amber-600 fill-amber-400 drop-shadow-lg" size={34} />
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="absolute bottom-28 inset-x-0 flex justify-center">
        <div className="bg-card shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-3 border border-border">
          <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">A</div>
          <div>
            <div className="flex items-center gap-1"><span className="font-bold text-sm">Abdullah</span><TrustedBadge size={14} /></div>
            <span className="text-[11px] text-muted-foreground">{ar ? "بائع موثوق · الرياض" : "Verified seller · Riyadh"}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SceneBoost({ ar }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
        <Sparkles className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]" size={72} />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white text-3xl font-extrabold mt-6 text-center">{ar ? "عزّز إعلانك" : "Boost your listing"}</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white/70 text-center mt-1.5">{ar ? "وصل لكل دول الخليج" : "Reach the whole GCC"}</motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.85 }} className="mt-9 bg-amber-500 text-slate-900 font-extrabold px-9 py-4 rounded-2xl text-xl shadow-2xl">
        {ar ? "حمّل كاسر الآن" : "Get Kasir now"}
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-white/40 text-sm mt-5 tracking-widest">KASIR</motion.p>
    </div>
  );
}