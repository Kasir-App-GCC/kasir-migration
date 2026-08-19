// Quick-detail tags a seller can attach to a listing. The set returned for a
// listing is built from THREE inputs:
//   1) category   → base tags for that category
//   2) subcategory → extra tags specific to the chosen subcategory(ies)
//   3) condition  → tags are filtered to only those valid for the selected
//                   condition (a tag may declare `conditions` listing the
//                   condition ids it applies to; absent = all conditions).
// No tag ever restates a condition enum value (new / like_new / excellent /
// good / fair / poor) — that's already captured by the condition selector
// above, so it would contradict it.
// Values are stored as the `en` key; localizeListingTag() maps back to the
// active language for display on the item detail page.

const LISTING_TAGS = {
  electronics: {
    base: [
      { en: "With warranty", ar: "عليه ضمان", conditions: ["new", "like_new", "excellent"] },
      { en: "Original box", ar: "علبة أصلية" },
      { en: "Sealed", ar: "مختوم", conditions: ["new"] },
      { en: "Refurbished", ar: "مجدّد", conditions: ["good", "fair", "poor"] },
      { en: "All accessories", ar: "كل الملحقات" },
      { en: "Fast shipping", ar: "شحن سريع" },
    ],
    subcats: {
      Phones: [
        { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر", conditions: ["like_new", "excellent", "good", "fair"] },
      ],
      Laptops: [
        { en: "RAM upgraded", ar: "ذاكرة مطوّرة" },
        { en: "SSD", ar: "قرص SSD" },
      ],
      Tablets: [{ en: "Cellular", ar: "خلوي" }],
      "TVs & Screens": [{ en: "Wall mount included", ar: "حامل جداري" }],
      Audio: [{ en: "Noise cancelling", ar: "عزل ضوضاء" }],
      Gaming: [{ en: "Extra controller", ar: "يد إضافية" }],
      Accessories: [{ en: "Compatible", ar: "متوافق" }],
    },
  },
  cars: {
    base: [
      { en: "Full service history", ar: "سجل صيانة كامل" },
      { en: "No accidents", ar: "بلا حوادث" },
      { en: "Low mileage", ar: "ممشور قليل" },
      { en: "Valid inspection", ar: "فحص ساري" },
      { en: "Bank transfer ok", ar: "تحويل بنكي" },
      { en: "Lease transfer ok", ar: "تحويل عقد" },
    ],
    subcats: {
      Sedan: [{ en: "Fuel efficient", ar: "موفر للوقود" }],
      "SUV / 4x4": [
        { en: "4WD", ar: "دفع رباعي" },
        { en: "Off-road ready", ar: "جاهز للطرق الوعرة" },
      ],
      Motorcycles: [{ en: "Helmet included", ar: "خوذة مشمولة" }],
      "Parts & Accessories": [{ en: "Genuine part", ar: "قطعة أصلية" }],
    },
  },
  furniture: {
    base: [
      { en: "Disassembly available", ar: "تفكيك متاح" },
      { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      { en: "Delivery available", ar: "توصيل متاح" },
      { en: "Pet-free home", ar: "بيت بلا حيوانات" },
      { en: "Assembly included", ar: "تركيب متاح" },
      { en: "Gift-ready", ar: "جاهز للإهداء", conditions: ["new", "like_new", "excellent"] },
    ],
    subcats: {
      Sofas: [{ en: "Washable covers", ar: "أغطية قابلة للغسل" }],
      Beds: [{ en: "Mattress included", ar: "فرشة مشمولة" }],
      "Tables & Chairs": [{ en: "Extendable", ar: "قابل للتمديد" }],
      Storage: [{ en: "Adjustable shelves", ar: "رفوف قابلة للتعديل" }],
      Decor: [{ en: "Handmade", ar: "صناعة يدوية" }],
    },
  },
  fashion: {
    base: [
      { en: "Original tags", ar: "علامة أصلية", conditions: ["new", "like_new"] },
      { en: "Size exchange ok", ar: "تبديل مقاس" },
      { en: "Authentic", ar: "أصلي" },
      { en: "Limited edition", ar: "إصدار محدود" },
      { en: "In-season", ar: "من الموسم" },
      { en: "Final sale", ar: "بيع نهائي" },
    ],
    subcats: {
      Shoes: [{ en: "Original box", ar: "علبة أصلية", conditions: ["new", "like_new"] }],
      Bags: [{ en: "Dust bag included", ar: "كيس حفظ" }],
      Accessories: [{ en: "Gift-boxed", ar: "علبة إهداء" }],
    },
  },
  realestate: {
    base: [
      { en: "Direct owner", ar: "من المالك مباشرة" },
      { en: "No commission", ar: "بدون عمولة" },
      { en: "Furnished", ar: "مفروش" },
      { en: "Available now", ar: "متاح الآن" },
      { en: "Utilities included", ar: "شامل الخدمات" },
      { en: "Parking included", ar: "موقف مشمول" },
    ],
    subcats: {
      "For Rent": [{ en: "Short-term ok", ar: "قصير الأمد" }],
      Land: [
        { en: "Titled", ar: "مخطّط" },
        { en: "Corner plot", ar: "زاوية" },
      ],
      Villas: [{ en: "Maid room", ar: "غرفة عمالة" }],
      Apartments: [{ en: "Elevator", ar: "مصعد" }],
    },
  },
  services: {
    base: [
      { en: "Same-day service", ar: "خدمة بنفس اليوم" },
      { en: "Mobile service", ar: "خدمة متنقلة" },
      { en: "Licensed", ar: "مرخّص" },
      { en: "Materials included", ar: "شامل المواد" },
      { en: "Warranty on work", ar: "ضمان على العمل" },
      { en: "Online booking", ar: "حجز أونلاين" },
    ],
    subcats: {
      Cleaning: [{ en: "Eco-friendly", ar: "صديق للبيئة" }],
      Transport: [{ en: "Insured", ar: "مؤمّن" }],
      Events: [{ en: "Setup included", ar: "تركيب مشمول" }],
    },
  },
  toys: {
    base: [
      { en: "All pieces", ar: "كل القطع" },
      { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      { en: "Age-appropriate", ar: "مناسب للعمر" },
      { en: "Gift-ready", ar: "جاهز للإهداء", conditions: ["new", "like_new", "excellent"] },
      { en: "Battery-free", ar: "بلا بطاريات" },
      { en: "Original packaging", ar: "تغليف أصلي", conditions: ["new", "like_new"] },
    ],
    subcats: {
      "Board Games": [{ en: "Instructions included", ar: "دليل اللعب مشمول" }],
      Collectibles: [{ en: "Limited edition", ar: "إصدار محدود" }],
    },
  },
  sports: {
    base: [
      { en: "All accessories", ar: "كل الملحقات" },
      { en: "For beginners", ar: "للمبتدئين" },
      { en: "Indoor use", ar: "استخدام داخلي" },
      { en: "Outdoor use", ar: "استخدام خارجي" },
      { en: "Adjustable", ar: "قابل للتعديل" },
      { en: "Carry bag included", ar: "حقيبة حمل" },
    ],
    subcats: {
      Fitness: [{ en: "Folds flat", ar: "قابل للطي" }],
      Bicycles: [{ en: "Helmet included", ar: "خوذة مشمولة" }],
      "Team Sports": [{ en: "Full set", ar: "طقم كامل" }],
    },
  },
  books: {
    base: [
      { en: "No highlights", ar: "بلا تظليل", conditions: ["new", "like_new", "excellent", "good"] },
      { en: "Original", ar: "أصلي" },
      { en: "Complete set", ar: "مجموعة كاملة" },
      { en: "First edition", ar: "الطبعة الأولى" },
      { en: "Hardcover", ar: "غلاف مقوّى" },
      { en: "Gift-ready", ar: "جاهز للإهداء", conditions: ["new", "like_new", "excellent"] },
    ],
    subcats: {
      Textbooks: [{ en: "Edition noted", ar: "الطبعة مذكورة" }],
      Children: [{ en: "Illustrated", ar: "مصوّر" }],
    },
  },
  animals: {
    base: [
      { en: "Vaccinated", ar: "مطعّم" },
      { en: "Healthy", ar: "سليم" },
      { en: "With supplies", ar: "مع المستلزمات" },
      { en: "Tame", ar: "أليف" },
      { en: "Pedigree", ar: "أصيل" },
      { en: "Trained", ar: "مدرّب" },
    ],
    subcats: {
      Livestock: [{ en: "Grass-fed", ar: "تغذية طبيعية" }],
      Pets: [{ en: "Microchipped", ar: "بشريحة تعريف" }],
      Birds: [{ en: "Cage included", ar: "قفص مشمول" }],
      Fish: [{ en: "Tank included", ar: "حوض مشمول" }],
      Supplies: [{ en: "Starter kit", ar: "حقيبة بداية" }],
    },
  },
  jobs: {
    base: [
      { en: "Remote ok", ar: "عن بُعد" },
      { en: "Flexible hours", ar: "ساعات مرنة" },
      { en: "Immediate start", ar: "بدء فوري" },
      { en: "Experience required", ar: "يتطلب خبرة" },
      { en: "Visa provided", ar: "إقامة مشمولة" },
      { en: "Transportation provided", ar: "نقل مشمول" },
    ],
    subcats: {
      Freelance: [{ en: "Portfolio available", ar: "أعمال جاهزة" }],
    },
  },
  education: {
    base: [
      { en: "Certified", ar: "معتمد" },
      { en: "Online ok", ar: "أونلاين" },
      { en: "Materials included", ar: "شامل المواد" },
      { en: "Beginner friendly", ar: "للمبتدئين" },
      { en: "Group ok", ar: "جماعي" },
      { en: "One-on-one", ar: "خصوصي" },
    ],
    subcats: {
      Courses: [{ en: "Completion certificate", ar: "شهادة إتمام" }],
    },
  },
  occasions: {
    base: [
      { en: "Booking required", ar: "يتطلب حجز" },
      { en: "Mobile service", ar: "خدمة متنقلة" },
      { en: "All-inclusive", ar: "شامل الكل" },
      { en: "Available on date", ar: "متاح بالتاريخ" },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Sample available", ar: "عيّنة متاحة" },
    ],
    subcats: {
      Catering: [{ en: "Tasting available", ar: "تذوق متاح" }],
      Rentals: [{ en: "Setup included", ar: "تركيب مشمول" }],
    },
  },
  antiques: {
    base: [
      { en: "Authentic", ar: "أصلي" },
      { en: "With certificate", ar: "مع شهادة" },
      { en: "Rare", ar: "نادر" },
      { en: "No restoration", ar: "بدون ترميم" },
      { en: "Appraised", ar: "مقيّم" },
      { en: "Period piece", ar: "قطعة زمنية" },
    ],
    subcats: {
      Coins: [{ en: "Graded", ar: "مصنّف" }],
      Heritage: [{ en: "Museum quality", ar: "جودة متحفية" }],
    },
  },
  arts: {
    base: [
      { en: "Original", ar: "أصلي" },
      { en: "Framed", ar: "مؤطر" },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Signed", ar: "موقّع" },
      { en: "Ready to hang", ar: "جاهز للتعليق" },
      { en: "Limited edition", ar: "إصدار محدود" },
    ],
    subcats: {
      Paintings: [{ en: "Stretched canvas", ar: "كانفس مشدود" }],
      Calligraphy: [{ en: "Hand-carved", ar: "حفر يدوي" }],
    },
  },
  families: {
    base: [
      { en: "Fresh", ar: "طازج" },
      { en: "Made to order", ar: "حسب الطلب" },
      { en: "Local delivery", ar: "توصيل محلي" },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Family-made", ar: "منتج أسري" },
      { en: "Gift-ready", ar: "جاهز للإهداء" },
    ],
    subcats: {
      Food: [{ en: "Same-day prep", ar: "تحضير بنفس اليوم" }],
      "Bakery & Sweets": [{ en: "Sugar-free option", ar: "خيار بلا سكر" }],
      "Perfumes & Oud": [{ en: "Long-lasting", ar: "ثبات عالي" }],
      Handicrafts: [{ en: "Handmade", ar: "صناعة يدوية" }],
    },
  },
  other: {
    base: [
      { en: "Fast shipping", ar: "شحن سريع" },
      { en: "Authentic", ar: "أصلي" },
      { en: "Gift-ready", ar: "جاهز للإهداء", conditions: ["new", "like_new", "excellent"] },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Bulk available", ar: "متاح بالجملة" },
      { en: "No returns", ar: "بلا إرجاع" },
    ],
  },
};

export function getListingTags(category, subcategory, condition) {
  const def = LISTING_TAGS[category];
  if (!def) return [];
  const subs = Array.isArray(subcategory)
    ? subcategory
    : subcategory
      ? [subcategory]
      : [];
  let tags = [...(def.base || [])];
  for (const s of subs) {
    const extra = (def.subcats && def.subcats[s]) || [];
    tags = tags.concat(extra);
  }
  // Deduplicate by the stored `en` key (a subcategory extra may repeat a base tag).
  const seen = new Set();
  tags = tags.filter((t) => {
    if (seen.has(t.en)) return false;
    seen.add(t.en);
    return true;
  });
  // Filter to tags valid for the selected condition.
  if (condition) {
    tags = tags.filter((t) => !t.conditions || t.conditions.includes(condition));
  }
  return tags.map(({ en, ar }) => ({ en, ar }));
}

export function localizeListingTag(value, lang) {
  for (const cat of Object.keys(LISTING_TAGS)) {
    const def = LISTING_TAGS[cat];
    const all = [...(def.base || []), ...Object.values(def.subcats || {}).flat()];
    const found = all.find((t) => t.en === value);
    if (found) return lang === "ar" ? found.ar : found.en;
  }
  return value;
}