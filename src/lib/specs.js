// Structured per-category specification fields. Sellers fill these in on the
// listing form (only for categories that have them) and buyers see them in a
// "Specifications" block on the item page. Keeping the definitions here (not in
// the i18n dictionary) keeps the field schema co-located with its labels.

export const SPEC_FIELDS = {
  cars: [
    { key: "year", type: "number", en: "Year", ar: "السنة", placeholder: "2020" },
    { key: "make", type: "text", en: "Make", ar: "الماركة", placeholder: "Toyota" },
    { key: "mileage", type: "number", en: "Mileage (km)", ar: "الممشى (كم)", placeholder: "85000" },
    {
      key: "transmission", type: "select", en: "Transmission", ar: "ناقل الحركة",
      options: [
        { value: "automatic", en: "Automatic", ar: "أوتوماتيك" },
        { value: "manual", en: "Manual", ar: "عادي" },
      ],
    },
    {
      key: "fuel", type: "select", en: "Fuel", ar: "الوقود",
      options: [
        { value: "petrol", en: "Petrol", ar: "بنزين" },
        { value: "diesel", en: "Diesel", ar: "ديزل" },
        { value: "hybrid", en: "Hybrid", ar: "هايبرد" },
        { value: "electric", en: "Electric", ar: "كهرباء" },
      ],
    },
  ],
  realestate: [
    { key: "bedrooms", type: "number", en: "Bedrooms", ar: "غرف النوم", placeholder: "3" },
    { key: "bathrooms", type: "number", en: "Bathrooms", ar: "دورات المياه", placeholder: "2" },
    { key: "area", type: "number", en: "Area (m²)", ar: "المساحة (م²)", placeholder: "180" },
    {
      key: "furnished", type: "select", en: "Furnished", ar: "مفروش",
      options: [
        { value: "yes", en: "Yes", ar: "نعم" },
        { value: "no", en: "No", ar: "لا" },
      ],
    },
  ],
  electronics: [
    { key: "brand", type: "text", en: "Brand", ar: "الماركة", placeholder: "Apple" },
    { key: "model", type: "text", en: "Model", ar: "الموديل", placeholder: "iPhone 13" },
  ],
};

export function getSpecFields(category) {
  return SPEC_FIELDS[category] || [];
}

export function formatSpecValue(field, value, lang) {
  if (value == null || value === "") return "";
  if (field.type === "select") {
    const opt = (field.options || []).find((o) => o.value === value);
    return opt ? (lang === "ar" ? opt.ar : opt.en) : String(value);
  }
  return String(value);
}

// Returns the filled specs as an ordered array of { label, value } for display.
export function specsForDisplay(category, specs, lang) {
  if (!specs || typeof specs !== "object") return [];
  const fields = getSpecFields(category);
  return fields
    .map((f) => {
      const raw = specs[f.key];
      const val = formatSpecValue(f, raw, lang);
      return val ? { key: f.key, label: lang === "ar" ? f.ar : f.en, value: val } : null;
    })
    .filter(Boolean);
}