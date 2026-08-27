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
  phones: [
    { en: "With charger", ar: "مع الشاحن" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
    { en: "Sealed", ar: "مختوم" },
  ],
  computers: [
    { en: "With charger", ar: "مع الشاحن" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Under warranty", ar: "تحت الضمان" },
    { en: "SSD", ar: "SSD" },
  ],
  gaming: [
    { en: "With controllers", ar: "مع أذرع التحكم" },
    { en: "With games", ar: "مع الألعاب" },
    { en: "Sealed", ar: "مختوم" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
  ],
  home_electronics: [
    { en: "With remote", ar: "مع الريموت" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Under warranty", ar: "تحت الضمان" },
    { en: "Sealed", ar: "مختوم" },
  ],
  photography: [
    { en: "With lens", ar: "مع العدسة" },
    { en: "With bag", ar: "مع الحقيبة" },
    { en: "Under warranty", ar: "تحت الضمان" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
  ],
  cars: [
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "Full service history", ar: "سجل صيانة كامل" },
  ],
  bikes_watercraft: [
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "With helmet", ar: "مع الخوذة" },
    { en: "Registered", ar: "مسجّل" },
  ],
  trucks: [
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "Full service history", ar: "سجل صيانة كامل" },
    { en: "Under warranty", ar: "تحت الضمان" },
  ],
  car_parts: [
    { en: "Original OEM", ar: "قطع أصلية" },
    { en: "Aftermarket", ar: "بديل" },
    { en: "New", ar: "جديد" },
    { en: "With warranty", ar: "مع ضمان" },
  ],
  camping: [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Weather resistant", ar: "مقاوم للطقس" },
    { en: "With carrying bag", ar: "مع حقيبة حمل" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  realestate: [
    { en: "Furnished", ar: "مفروش" },
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  furniture: [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "Washable covers", ar: "أغطية قابلة للغسل" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  home_kitchen: [
    { en: "With warranty", ar: "مع ضمان" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Sealed", ar: "مختوم" },
    { en: "With receipt", ar: "مع الفاتورة" },
  ],
  fashion: [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
    { en: "With receipt", ar: "مع الفاتورة" },
  ],
  watches_jewelry: [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "With papers", ar: "مع الأوراق" },
  ],
  beauty: [
    { en: "Original", ar: "أصلي" },
    { en: "Sealed", ar: "مختوم" },
    { en: "Tester", ar: "تستر" },
    { en: "New", ar: "جديد" },
  ],
  kids_babies: [
    { en: "All pieces", ar: "كل القطع" },
    { en: "Original packaging", ar: "بالتغليف الأصلي" },
    { en: "Age-appropriate", ar: "مناسب للعمر" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  sports: [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
    { en: "Still tagged", ar: "بالبطاقة" },
  ],
  music: [
    { en: "With case", ar: "مع الحقيبة" },
    { en: "With amplifier", ar: "مع المضخم" },
    { en: "Original", ar: "أصلي" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  hobbies: [
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Limited edition", ar: "إصدار محدود" },
    { en: "Rare", ar: "نادر" },
    { en: "Complete set", ar: "طقم كامل" },
  ],
  animals: [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Trained", ar: "مدرّب" },
    { en: "Healthy", ar: "سليم" },
    { en: "With supplies", ar: "مع المستلزمات" },
  ],
  tools: [
    { en: "Professional", ar: "احترافي" },
    { en: "With case", ar: "مع العلبة" },
    { en: "With warranty", ar: "مع ضمان" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  business_equipment: [
    { en: "Commercial grade", ar: "درجة تجارية" },
    { en: "Ready to operate", ar: "جاهز للتشغيل" },
    { en: "With warranty", ar: "مع ضمان" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  productive_families: [
    { en: "Fresh", ar: "طازج" },
    { en: "Same-day", ar: "بنفس اليوم" },
    { en: "Natural", ar: "طبيعي" },
    { en: "Organic", ar: "عضوي" },
    { en: "Custom order", ar: "حسب الطلب" },
    { en: "Delivery", ar: "توصيل" },
  ],
  services: [
    { en: "Licensed", ar: "مرخّص" },
    { en: "Same-day", ar: "بنفس اليوم" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "Materials included", ar: "شامل المواد" },
  ],
  other: [
    { en: "Authentic", ar: "أصلي" },
    { en: "Working", ar: "شغّال" },
    { en: "Customizable", ar: "حسب الطلب" },
  ],
};

export function getBuyRequestTagsForCategory(category, subcategory) {
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