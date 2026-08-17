import React from "react";
import RiyalSymbol from "@/components/RiyalSymbol";
import { getCountry } from "@/lib/countries";

/**
 * Renders the currency symbol/label for a given country code.
 * Saudi Arabia uses the official Riyal glyph (SVG); other countries show
 * their ISO code (en) or Arabic short form (ar).
 */
export default function CurrencySymbol({ country = "SA", lang = "en", size = 13, className = "", style = {} }) {
  const c = getCountry(country);
  if (c.code === "SA") return <RiyalSymbol size={size} className={className} style={style} />;
  return (
    <span className={`font-bold leading-none ${className}`} style={{ fontSize: `${size}px`, ...style }}>
      {lang === "ar" ? c.currencyAr : c.currency}
    </span>
  );
}