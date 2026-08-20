// Universal buy-intent tags a buyer can attach to a buy request. These help
// sellers filter and find suitable posts without reading every single one.
// Values are stored as the `en` key; localizeBuyRequestTag() maps back to the
// active language for display.

export const BUY_REQUEST_TAGS = [
  { en: "Urgent", ar: "عاجل" },
  { en: "New only", ar: "جديد فقط" },
  { en: "Used ok", ar: "مستعمل مقبول" },
  { en: "With warranty", ar: "مع ضمان" },
  { en: "Delivery", ar: "توصيل" },
  { en: "Pickup", ar: "استلام" },
  { en: "Bulk quantity", ar: "كمية كبيرة" },
  { en: "Gift", ar: "هدية" },
];

export function localizeBuyRequestTag(value, lang) {
  const tag = BUY_REQUEST_TAGS.find((t) => t.en === value);
  return tag ? (lang === "ar" ? tag.ar : tag.en) : value;
}