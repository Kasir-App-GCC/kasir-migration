import React, { useState, useRef, useEffect } from "react";
import { Search, Check, MapPin } from "lucide-react";

export default function CitySearchSelect({ value, onChange, cities, lang, placeholder }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = cities.find((c) => c.en === value);
  const displayValue = selected ? (lang === "ar" ? selected.ar : selected.en) : "";
  const filtered = search
    ? cities.filter((c) => {
        const q = search.toLowerCase();
        return c.en.toLowerCase().includes(q) || c.ar.includes(search);
      })
    : cities;

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={open ? search : displayValue}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={placeholder || (lang === "ar" ? "ابحث عن مدينة..." : "Search city...")}
          className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30"
        />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{lang === "ar" ? "لا توجد نتائج" : "No results"}</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.en}
                type="button"
                onClick={() => {
                  onChange(c.en);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-start hover:bg-muted transition ${value === c.en ? "font-bold text-primary" : ""}`}
              >
                <MapPin size={14} className="shrink-0 text-muted-foreground" />
                <span>{lang === "ar" ? c.ar : c.en}</span>
                {value === c.en && <Check size={14} className="ms-auto text-primary shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}