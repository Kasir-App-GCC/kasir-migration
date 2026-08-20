// Universal buy-intent tags a buyer can attach to a buy request, plus
// category-specific tags. These help sellers filter and find suitable posts
// without reading every single one.
// Values are stored as the `en` key; localizeBuyRequestTag() maps back to the
// active language for display.

export const BUY_REQUEST_TAGS = [
  { en: "Urgent", ar: "عاجل" },
  { en: "New only", ar: "جديد فقط" },
  { en: "Used ok", ar: "مستعمل مقبول" },
  { en: "With warranty", ar: "مع ضمان" },
  { en: "Delivery", ar: "توصيل" },
  { en: "Pickup", ar: "استلام" },
  { en: "Gift", ar: "هدية" },
];

export const BUY_REQUEST_CATEGORY_TAGS = {
  electronics: [
    { en: "Charger included", ar: "مع الشاحن" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
    { en: "Sealed", ar: "مختوم" },
  ],
  cars: [
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "Full service history", ar: "سجل صيانة كامل" },
  ],
  furniture: [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "Washable covers", ar: "أغطية قابلة للغسل" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  fashion: [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
    { en: "From clean closet", ar: "من خزانة نظيفة" },
  ],
  realestate: [
    { en: "Furnished", ar: "مفروش" },
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  services: [
    { en: "Licensed", ar: "مرخّص" },
    { en: "Same-day", ar: "بنفس اليوم" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "Materials included", ar: "شامل المواد" },
  ],
  toys: [
    { en: "All pieces", ar: "كل القطع" },
    { en: "Original packaging", ar: "بالتغليف الأصلي" },
    { en: "Complete set", ar: "طقم كامل" },
    { en: "Age-appropriate", ar: "مناسب للعمر" },
  ],
  sports: [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
  ],
  books: [
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Clean pages", ar: "صفحات نظيفة" },
    { en: "Hardcover", ar: "غلاف مقوّى" },
    { en: "Complete set", ar: "مجموعة كاملة" },
  ],
  animals: [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Trained", ar: "مدرّب" },
    { en: "Healthy", ar: "سليم" },
    { en: "With supplies", ar: "مع المستلزمات" },
  ],
  jobs: [
    { en: "Remote ok", ar: "عن بُعد" },
    { en: "Visa provided", ar: "إقامة مشمولة" },
    { en: "Immediate start", ar: "بدء فوري" },
    { en: "Flexible hours", ar: "ساعات مرنة" },
  ],
  education: [
    { en: "Certified", ar: "معتمد" },
    { en: "Free trial", ar: "تجربة مجانية" },
    { en: "One-on-one", ar: "خصوصي" },
    { en: "Beginner friendly", ar: "للمبتدئين" },
  ],
  occasions: [
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Setup included", ar: "تركيب مشمول" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
  ],
  antiques: [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
    { en: "Appraised", ar: "مقيّم" },
  ],
  arts: [
    { en: "Signed", ar: "موقّع" },
    { en: "Framed", ar: "مؤطر" },
    { en: "Limited edition", ar: "إصدار محدود" },
    { en: "Handmade", ar: "صناعة يدوية" },
  ],
  families: [
    { en: "Fresh", ar: "طازج" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
  ],
  other: [
    { en: "Authentic", ar: "أصلي" },
    { en: "Working", ar: "شغّال" },
    { en: "Customizable", ar: "حسب الطلب" },
  ],
};

export function getBuyRequestTagsForCategory(category) {
  return BUY_REQUEST_CATEGORY_TAGS[category] || [];
}

export function localizeBuyRequestTag(value, lang) {
  const tag = BUY_REQUEST_TAGS.find((t) => t.en === value);
  if (tag) return lang === "ar" ? tag.ar : tag.en;
  for (const cat of Object.keys(BUY_REQUEST_CATEGORY_TAGS)) {
    const found = BUY_REQUEST_CATEGORY_TAGS[cat].find((t) => t.en === value);
    if (found) return lang === "ar" ? found.ar : found.en;
  }
  return value;
}