import React, { useState, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

export default function MapSearchBar({ onSelect, country, placeholder }) {
  const { lang, country: storeCountry } = useStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("geocodeLocation", {
          query: q.trim(),
          country: country || storeCountry,
          lang,
        });
        setResults(res?.data?.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
      setOpen(true);
    }, 450);
    return () => clearTimeout(timer.current);
  }, [q, country, storeCountry, lang]);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (r) => {
    onSelect({ lat: r.lat, lng: r.lng, label: r.label });
    setQ(r.label);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative z-[1000]">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-card border border-border/60 shadow-sm">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || (lang === "ar" ? "ابحث عن موقع…" : "Search a location…")}
          className="flex-1 bg-transparent outline-none text-sm min-w-0"
        />
        {loading && <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin shrink-0" />}
        {q && !loading && (
          <button onClick={() => { setQ(""); setResults([]); }} className="text-muted-foreground hover:text-foreground shrink-0">
            <X size={15} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 inset-x-0 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} onClick={() => pick(r)} className="w-full flex items-start gap-2 px-3 py-2.5 text-start hover:bg-muted transition border-b border-border/40 last:border-0">
              <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
              <span className="text-sm leading-snug line-clamp-2">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}