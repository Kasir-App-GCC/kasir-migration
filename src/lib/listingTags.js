// Quick attribute tags a seller can attach to a listing, scoped per category.
// These are GENUINE attributes only — they must not restate fields already
// captured above in the form (condition, price, category, subcategory).
// Values are stored as the `en` key; localizeListingTag() maps back to the
// active language for display on the item detail page.

export const LISTING_TAGS = {
  electronics: [
    { en: "With warranty", ar: "عليه ضمان" },
    { en: "Original box", ar: "علبة أصلية" },
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Fast shipping", ar: "شحن سريع" },
    { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
    { en: "Gift-ready", ar: "جاهز للإهداء" },
  ],
  cars: [
    { en: "Full service history", ar: "سجل صيانة كامل" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "Valid inspection", ar: "فحص ساري" },
    { en: "Bank transfer ok", ar: "تحويل بنكي" },
    { en: "Lease transfer ok", ar: "تحويل عقد" },
  ],
  furniture: [
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "Smoke-free home", ar: "بيت بلا تدخين" },
    { en: "Delivery available", ar: "توصيل متاح" },
    { en: "Pet-free home", ar: "بيت بلا حيوانات" },
    { en: "Assembly included", ar: "تركيب متاح" },
    { en: "Gift-ready", ar: "جاهز للإهداء" },
  ],
  fashion: [
    { en: "Original tags", ar: "علامة أصلية" },
    { en: "Size exchange ok", ar: "تبديل مقاس" },
    { en: "Authentic", ar: "أصلي" },
    { en: "Final sale", ar: "بيع نهائي" },
    { en: "Limited edition", ar: "إصدار محدود" },
    { en: "In-season", ar: "من الموسم" },
  ],
  realestate: [
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Furnished", ar: "مفروش" },
    { en: "Available now", ar: "متاح الآن" },
    { en: "Utilities included", ar: "شامل الخدمات" },
    { en: "Parking included", ar: "موقف مشمول" },
  ],
  services: [
    { en: "Same-day service", ar: "خدمة بنفس اليوم" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "Licensed", ar: "مرخّص" },
    { en: "Materials included", ar: "شامل المواد" },
    { en: "Warranty on work", ar: "ضمان على العمل" },
    { en: "Online booking", ar: "حجز أونلاين" },
  ],
  toys: [
    { en: "All pieces", ar: "كل القطع" },
    { en: "Smoke-free home", ar: "بيت بلا تدخين" },
    { en: "Age-appropriate", ar: "مناسب للعمر" },
    { en: "Gift-ready", ar: "جاهز للإهداء" },
    { en: "Battery-free", ar: "بلا بطاريات" },
    { en: "Original packaging", ar: "تغليف أصلي" },
  ],
  sports: [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "For beginners", ar: "للمبتدئين" },
    { en: "Indoor use", ar: "استخدام داخلي" },
    { en: "Outdoor use", ar: "استخدام خارجي" },
    { en: "Adjustable", ar: "قابل للتعديل" },
    { en: "Carry bag included", ar: "حقيبة حمل" },
  ],
  books: [
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Original", ar: "أصلي" },
    { en: "Complete set", ar: "مجموعة كاملة" },
    { en: "First edition", ar: "الطبعة الأولى" },
    { en: "Hardcover", ar: "غلاف مقوّى" },
    { en: "Gift-ready", ar: "جاهز للإهداء" },
  ],
  animals: [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Healthy", ar: "سليم" },
    { en: "With supplies", ar: "مع المستلزمات" },
    { en: "Tame", ar: "أليف" },
    { en: "Pedigree", ar: "أصيل" },
    { en: "Trained", ar: "مدرّب" },
  ],
  jobs: [
    { en: "Remote ok", ar: "عن بُعد" },
    { en: "Flexible hours", ar: "ساعات مرنة" },
    { en: "Immediate start", ar: "بدء فوري" },
    { en: "Experience required", ar: "يتطلب خبرة" },
    { en: "Part-time", ar: "دوام جزئي" },
    { en: "Full-time", ar: "دوام كامل" },
  ],
  education: [
    { en: "Certified", ar: "معتمد" },
    { en: "Online ok", ar: "أونلاين" },
    { en: "Materials included", ar: "شامل المواد" },
    { en: "Beginner friendly", ar: "للمبتدئين" },
    { en: "Group ok", ar: "جماعي" },
    { en: "One-on-one", ar: "خصوصي" },
  ],
  occasions: [
    { en: "Booking required", ar: "يتطلب حجز" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Sample available", ar: "عيّنة متاحة" },
  ],
  antiques: [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
    { en: "No restoration", ar: "بدون ترميم" },
    { en: "Appraised", ar: "مقيّم" },
    { en: "Period piece", ar: "قطعة زمنية" },
  ],
  arts: [
    { en: "Original", ar: "أصلي" },
    { en: "Framed", ar: "مؤطر" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Signed", ar: "موقّع" },
    { en: "Ready to hang", ar: "جاهز للتعليق" },
    { en: "Limited edition", ar: "إصدار محدود" },
  ],
  families: [
    { en: "Fresh", ar: "طازج" },
    { en: "Made to order", ar: "حسب الطلب" },
    { en: "Local delivery", ar: "توصيل محلي" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Gift-ready", ar: "جاهز للإهداء" },
  ],
  other: [
    { en: "Fast shipping", ar: "شحن سريع" },
    { en: "Authentic", ar: "أصلي" },
    { en: "Gift-ready", ar: "جاهز للإهداء" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Bulk available", ar: "متاح بالجملة" },
    { en: "No returns", ar: "بلا إرجاع" },
  ],
};

export function getListingTags(category) {
  return LISTING_TAGS[category] || [];
}

export function localizeListingTag(value, lang) {
  for (const cat of Object.keys(LISTING_TAGS)) {
    const found = LISTING_TAGS[cat].find((t) => t.en === value);
    if (found) return lang === "ar" ? found.ar : found.en;
  }
  return value;
}