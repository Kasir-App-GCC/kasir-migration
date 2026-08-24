// Shared age-range and gender options used at signup (ProfileSetup) and
// aggregated in the admin demographics panel. Keeping them in one place
// ensures the admin buckets match the signup chip ids exactly.
export const AGE_RANGES = [
  { id: "under_16", ar: "أقل من ١٦", en: "Under 16" },
  { id: "16_19", ar: "١٦–١٩", en: "16–19" },
  { id: "20_29", ar: "٢٠–٢٩", en: "20–29" },
  { id: "30_39", ar: "٣٠–٣٩", en: "30–39" },
  { id: "40_49", ar: "٤٠–٤٩", en: "40–49" },
  { id: "50_plus", ar: "٥٠ فأكثر", en: "50+" },
];

export const GENDERS = [
  { id: "male", ar: "ذكر", en: "Male" },
  { id: "female", ar: "أنثى", en: "Female" },

];