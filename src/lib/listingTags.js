// Quick attribute tags a seller can attach to a listing, scoped per category.
// Values are stored as the `en` key; localizeListingTag() maps back to the
// active language for display on the item detail page.

export const LISTING_TAGS = {
  electronics: [
    { en: "With warranty", ar: "عليه ضمان" },
    { en: "Original box", ar: "علبة أصلية" },
    { en: "No scratches", ar: "بلا خدوش" },
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Fast shipping", ar: "شحن سريع" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  cars: [
    { en: "Full service history", ar: "سجل صيانة كامل" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "Valid inspection", ar: "فحص ساري" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
    { en: "Bank transfer ok", ar: "تحويل بنكي" },
  ],
  furniture: [
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "Smoke-free home", ar: "بيت بلا تدخين" },
    { en: "Delivery available", ar: "توصيل متاح" },
    { en: "Pet-free home", ar: "بيت بلا حيوانات" },
    { en: "Like new", ar: "كالجديد" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  fashion: [
    { en: "Never worn", ar: "ما لبس" },
    { en: "Original tags", ar: "علامة أصلية" },
    { en: "Size exchange ok", ar: "تبديل مقاس" },
    { en: "Authentic", ar: "أصلي" },
    { en: "Final sale", ar: "بيع نهائي" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  realestate: [
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Furnished", ar: "مفروش" },
    { en: "Available now", ar: "متاح الآن" },
    { en: "Utilities included", ar: "شامل الخدمات" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  services: [
    { en: "Same-day service", ar: "خدمة بنفس اليوم" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "Licensed", ar: "مرخّص" },
    { en: "Materials included", ar: "شامل المواد" },
    { en: "Warranty on work", ar: "ضمان على العمل" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  toys: [
    { en: "Barely used", ar: "بالكاد مستخدم" },
    { en: "All pieces", ar: "كل القطع" },
    { en: "Smoke-free home", ar: "بيت بلا تدخين" },
    { en: "Age-appropriate", ar: "مناسب للعمر" },
    { en: "Clean", ar: "نظيف" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  sports: [
    { en: "Barely used", ar: "بالكاد مستخدم" },
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "For beginners", ar: "للمبتدئين" },
    { en: "Indoor use", ar: "استخدام داخلي" },
    { en: "Clean", ar: "نظيف" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  books: [
    { en: "Like new", ar: "كالجديد" },
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Original", ar: "أصلي" },
    { en: "Complete set", ar: "مجموعة كاملة" },
    { en: "Clean", ar: "نظيف" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  animals: [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Healthy", ar: "سليم" },
    { en: "With supplies", ar: "مع المستلزمات" },
    { en: "Tame", ar: "أليف" },
    { en: "Pedigree", ar: "أصيل" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
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
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  occasions: [
    { en: "Booking required", ar: "يتطلب حجز" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  antiques: [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
    { en: "Good condition", ar: "بحالة جيدة" },
    { en: "No restoration", ar: "بدون ترميم" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  arts: [
    { en: "Original", ar: "أصلي" },
    { en: "Framed", ar: "مؤطر" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Signed", ar: "موقّع" },
    { en: "Ready to hang", ar: "جاهز للتعليق" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  families: [
    { en: "Fresh", ar: "طازج" },
    { en: "Made to order", ar: "حسب الطلب" },
    { en: "Local delivery", ar: "توصيل محلي" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Negotiable", ar: "قابل للتفاوض" },
  ],
  other: [
    { en: "Negotiable", ar: "قابل للتفاوض" },
    { en: "Fast shipping", ar: "شحن سريع" },
    { en: "Like new", ar: "كالجديد" },
    { en: "Authentic", ar: "أصلي" },
    { en: "Good condition", ar: "بحالة جيدة" },
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