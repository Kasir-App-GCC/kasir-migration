// Quick-detail tags a seller can attach to a listing. The set returned for a
// listing is built from THREE inputs so it visibly changes as the seller
// changes any of them:
//   1) category    → base tags for that category
//   2) subcategory → extra tags specific to the chosen subcategory(ies)
//   3) condition   → tags are split into groups:
//        common : always shown
//        newish : shown for "new" / "like_new"
//        used   : shown for "excellent" / "good" / "fair" / "poor"
//        worn   : additionally shown for "fair" / "poor"
// No tag ever restates a condition enum value (new / like_new / excellent /
// good / fair / poor) — that's already captured by the condition selector
// above, so it would contradict it. No shipping/delivery tags (the platform
// does not offer shipping).
// Values are stored as the `en` key; localizeListingTag() maps back to the
// active language for display on the item detail page.

const LISTING_TAGS = {
  electronics: {
    common: [
      { en: "All accessories", ar: "كل الملحقات" },
      { en: "Original box", ar: "علبة أصلية" },
    ],
    newish: [
      { en: "With warranty", ar: "عليه ضمان" },
      { en: "Sealed", ar: "مختوم" },
      { en: "Gift-ready", ar: "جاهز للإهداء" },
    ],
    used: [
      { en: "Refurbished", ar: "مجدّد" },
      { en: "Tested & working", ar: "مجرّب وشغّال" },
      { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
    ],
    worn: [
      { en: "Sold as-is", ar: "يباع كحالته" },
      { en: "For parts", ar: "للقطع" },
    ],
    subcats: {
      Phones: [{ en: "Unlocked", ar: "مفتوح لكل الشبكات" }],
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
    common: [
      { en: "Full service history", ar: "سجل صيانة كامل" },
      { en: "Valid inspection", ar: "فحص ساري" },
      { en: "Bank transfer ok", ar: "تحويل بنكي" },
    ],
    newish: [
      { en: "Under warranty", ar: "تحت الضمان" },
      { en: "Never registered", ar: "غير مسجّل" },
      { en: "Gift-ready", ar: "جاهز للإهداء" },
    ],
    used: [
      { en: "No accidents", ar: "بلا حوادث" },
      { en: "Low mileage", ar: "ممشور قليل" },
      { en: "Single owner", ar: "مالك واحد" },
    ],
    worn: [
      { en: "Needs work", ar: "يحتاج إصلاح" },
      { en: "For parts", ar: "للقطع" },
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
    common: [
      { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      { en: "Pet-free home", ar: "بيت بلا حيوانات" },
      { en: "Assembly included", ar: "تركيب متاح" },
    ],
    newish: [
      { en: "Gift-ready", ar: "جاهز للإهداء" },
      { en: "Still in packaging", ar: "لا يزال بالتغليف" },
    ],
    used: [
      { en: "Disassembly available", ar: "تفكيك متاح" },
      { en: "Well maintained", ar: "معتنى به" },
    ],
    worn: [
      { en: "Needs restoration", ar: "يحتاج ترميم" },
      { en: "DIY project", ar: "مشروع شخصي" },
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
    common: [
      { en: "Authentic", ar: "أصلي" },
      { en: "Size exchange ok", ar: "تبديل مقاس" },
      { en: "Limited edition", ar: "إصدار محدود" },
    ],
    newish: [
      { en: "Original tags", ar: "علامة أصلية" },
      { en: "In-season", ar: "من الموسم" },
      { en: "Gift-boxed", ar: "علبة إهداء" },
    ],
    used: [
      { en: "Final sale", ar: "بيع نهائي" },
      { en: "From a clean closet", ar: "من خزانة نظيفة" },
    ],
    worn: [
      { en: "Needs repair", ar: "يحتاج إصلاح" },
      { en: "For upcycling", ar: "لإعادة التدوير" },
    ],
    subcats: {
      Shoes: [{ en: "Original box", ar: "علبة أصلية" }],
      Bags: [{ en: "Dust bag included", ar: "كيس حفظ" }],
      Accessories: [{ en: "Gift-boxed", ar: "علبة إهداء" }],
    },
  },
  realestate: {
    common: [
      { en: "Direct owner", ar: "من المالك مباشرة" },
      { en: "No commission", ar: "بدون عمولة" },
      { en: "Available now", ar: "متاح الآن" },
    ],
    newish: [
      { en: "Furnished", ar: "مفروش" },
      { en: "Never occupied", ar: "غير مأهول" },
    ],
    used: [
      { en: "Utilities included", ar: "شامل الخدمات" },
      { en: "Parking included", ar: "موقف مشمول" },
      { en: "Elevator", ar: "مصعد" },
    ],
    worn: [
      { en: "Needs renovation", ar: "يحتاج تجديد" },
      { en: "Fixer-upper", ar: "تحت الصيانة" },
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
    common: [
      { en: "Licensed", ar: "مرخّص" },
      { en: "Warranty on work", ar: "ضمان على العمل" },
      { en: "Online booking", ar: "حجز أونلاين" },
    ],
    newish: [
      { en: "Same-day service", ar: "خدمة بنفس اليوم" },
      { en: "First-time discount", ar: "خصم أول طلب" },
    ],
    used: [
      { en: "Mobile service", ar: "خدمة متنقلة" },
      { en: "Materials included", ar: "شامل المواد" },
    ],
    worn: [],
    subcats: {
      Cleaning: [{ en: "Eco-friendly", ar: "صديق للبيئة" }],
      Transport: [{ en: "Insured", ar: "مؤمّن" }],
      Events: [{ en: "Setup included", ar: "تركيب مشمول" }],
    },
  },
  toys: {
    common: [
      { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      { en: "Age-appropriate", ar: "مناسب للعمر" },
      { en: "Battery-free", ar: "بلا بطاريات" },
    ],
    newish: [
      { en: "Gift-ready", ar: "جاهز للإهداء" },
      { en: "Original packaging", ar: "تغليف أصلي" },
      { en: "Sealed", ar: "مختوم" },
    ],
    used: [
      { en: "All pieces", ar: "كل القطع" },
      { en: "Complete set", ar: "طقم كامل" },
    ],
    worn: [
      { en: "Restorable", ar: "قابل للترميم" },
      { en: "For parts", ar: "للقطع" },
    ],
    subcats: {
      "Board Games": [{ en: "Instructions included", ar: "دليل اللعب مشمول" }],
      Collectibles: [{ en: "Limited edition", ar: "إصدار محدود" }],
    },
  },
  sports: {
    common: [
      { en: "For beginners", ar: "للمبتدئين" },
      { en: "Adjustable", ar: "قابل للتعديل" },
      { en: "Carry bag included", ar: "حقيبة حمل" },
    ],
    newish: [
      { en: "Gift-ready", ar: "جاهز للإهداء" },
      { en: "Still tagged", ar: "لا يزال بالبطاقة" },
    ],
    used: [
      { en: "All accessories", ar: "كل الملحقات" },
      { en: "Indoor use", ar: "استخدام داخلي" },
      { en: "Outdoor use", ar: "استخدام خارجي" },
    ],
    worn: [
      { en: "Needs maintenance", ar: "يحتاج صيانة" },
      { en: "For parts", ar: "للقطع" },
    ],
    subcats: {
      Fitness: [{ en: "Folds flat", ar: "قابل للطي" }],
      Bicycles: [{ en: "Helmet included", ar: "خوذة مشمولة" }],
      "Team Sports": [{ en: "Full set", ar: "طقم كامل" }],
    },
  },
  books: {
    common: [
      { en: "Original", ar: "أصلي" },
      { en: "Complete set", ar: "مجموعة كاملة" },
      { en: "Hardcover", ar: "غلاف مقوّى" },
    ],
    newish: [
      { en: "First edition", ar: "الطبعة الأولى" },
      { en: "Gift-ready", ar: "جاهز للإهداء" },
      { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
    ],
    used: [
      { en: "No highlights", ar: "بلا تظليل" },
      { en: "Clean pages", ar: "صفحات نظيفة" },
    ],
    worn: [
      { en: "Highlighted", ar: "فيه تظليل" },
      { en: "Loose binding", ar: "تجليد مرتخي" },
    ],
    subcats: {
      Textbooks: [{ en: "Edition noted", ar: "الطبعة مذكورة" }],
      Children: [{ en: "Illustrated", ar: "مصوّر" }],
    },
  },
  animals: {
    common: [
      { en: "Healthy", ar: "سليم" },
      { en: "Tame", ar: "أليف" },
      { en: "Pedigree", ar: "أصيل" },
    ],
    newish: [
      { en: "Vaccinated", ar: "مطعّم" },
      { en: "Young", ar: "صغير السن" },
    ],
    used: [
      { en: "Trained", ar: "مدرّب" },
      { en: "With supplies", ar: "مع المستلزمات" },
    ],
    worn: [],
    subcats: {
      Livestock: [{ en: "Grass-fed", ar: "تغذية طبيعية" }],
      Pets: [{ en: "Microchipped", ar: "بشريحة تعريف" }],
      Birds: [{ en: "Cage included", ar: "قفص مشمول" }],
      Fish: [{ en: "Tank included", ar: "حوض مشمول" }],
      Supplies: [{ en: "Starter kit", ar: "حقيبة بداية" }],
    },
  },
  jobs: {
    common: [
      { en: "Remote ok", ar: "عن بُعد" },
      { en: "Flexible hours", ar: "ساعات مرنة" },
      { en: "Immediate start", ar: "بدء فوري" },
    ],
    newish: [
      { en: "Entry level", ar: "للمبتدئين" },
      { en: "Training provided", ar: "تدريب مشمول" },
    ],
    used: [
      { en: "Experience required", ar: "يتطلب خبرة" },
      { en: "Visa provided", ar: "إقامة مشمولة" },
    ],
    worn: [],
    subcats: {
      Freelance: [{ en: "Portfolio available", ar: "أعمال جاهزة" }],
    },
  },
  education: {
    common: [
      { en: "Certified", ar: "معتمد" },
      { en: "Online ok", ar: "أونلاين" },
      { en: "Beginner friendly", ar: "للمبتدئين" },
    ],
    newish: [
      { en: "Free trial", ar: "تجربة مجانية" },
      { en: "First-time discount", ar: "خصم أول طلب" },
    ],
    used: [
      { en: "Materials included", ar: "شامل المواد" },
      { en: "Group ok", ar: "جماعي" },
      { en: "One-on-one", ar: "خصوصي" },
    ],
    worn: [],
    subcats: {
      Courses: [{ en: "Completion certificate", ar: "شهادة إتمام" }],
    },
  },
  occasions: {
    common: [
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Booking required", ar: "يتطلب حجز" },
      { en: "Sample available", ar: "عيّنة متاحة" },
    ],
    newish: [
      { en: "All-inclusive", ar: "شامل الكل" },
      { en: "First-time discount", ar: "خصم أول طلب" },
    ],
    used: [
      { en: "Mobile service", ar: "خدمة متنقلة" },
      { en: "Available on date", ar: "متاح بالتاريخ" },
      { en: "Setup included", ar: "تركيب مشمول" },
    ],
    worn: [],
    subcats: {
      Catering: [{ en: "Tasting available", ar: "تذوق متاح" }],
      Rentals: [{ en: "Setup included", ar: "تركيب مشمول" }],
    },
  },
  antiques: {
    common: [
      { en: "Authentic", ar: "أصلي" },
      { en: "Rare", ar: "نادر" },
      { en: "Period piece", ar: "قطعة زمنية" },
    ],
    newish: [
      { en: "With certificate", ar: "مع شهادة" },
      { en: "Appraised", ar: "مقيّم" },
    ],
    used: [
      { en: "No restoration", ar: "بدون ترميم" },
      { en: "Aged patina", ar: "باتينا زمنية" },
    ],
    worn: [
      { en: "Needs restoration", ar: "يحتاج ترميم" },
      { en: "Restorable", ar: "قابل للترميم" },
    ],
    subcats: {
      Coins: [{ en: "Graded", ar: "مصنّف" }],
      Heritage: [{ en: "Museum quality", ar: "جودة متحفية" }],
    },
  },
  arts: {
    common: [
      { en: "Original", ar: "أصلي" },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Ready to hang", ar: "جاهز للتعليق" },
    ],
    newish: [
      { en: "Signed", ar: "موقّع" },
      { en: "Limited edition", ar: "إصدار محدود" },
      { en: "Framed", ar: "مؤطر" },
    ],
    used: [
      { en: "Hand-carved", ar: "حفر يدوي" },
      { en: "Stretched canvas", ar: "كانفس مشدود" },
    ],
    worn: [
      { en: "Needs reframing", ar: "يحتاج تأطير" },
      { en: "Restorable", ar: "قابل للترميم" },
    ],
    subcats: {
      Paintings: [{ en: "Stretched canvas", ar: "كانفس مشدود" }],
      Calligraphy: [{ en: "Hand-carved", ar: "حفر يدوي" }],
    },
  },
  families: {
    common: [
      { en: "Family-made", ar: "منتج أسري" },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Made to order", ar: "حسب الطلب" },
    ],
    newish: [
      { en: "Fresh", ar: "طازج" },
      { en: "Gift-ready", ar: "جاهز للإهداء" },
    ],
    used: [
      { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
      { en: "Sugar-free option", ar: "خيار بلا سكر" },
    ],
    worn: [],
    subcats: {
      Food: [{ en: "Same-day prep", ar: "تحضير بنفس اليوم" }],
      "Bakery & Sweets": [{ en: "Sugar-free option", ar: "خيار بلا سكر" }],
      "Perfumes & Oud": [{ en: "Long-lasting", ar: "ثبات عالي" }],
      Handicrafts: [{ en: "Handmade", ar: "صناعة يدوية" }],
    },
  },
  other: {
    common: [
      { en: "Authentic", ar: "أصلي" },
      { en: "Customizable", ar: "حسب الطلب" },
      { en: "Bulk available", ar: "متاح بالجملة" },
    ],
    newish: [
      { en: "Gift-ready", ar: "جاهز للإهداء" },
      { en: "Sealed", ar: "مختوم" },
    ],
    used: [
      { en: "No returns", ar: "بلا إرجاع" },
      { en: "As-is", ar: "كحالته" },
    ],
    worn: [
      { en: "For parts", ar: "للقطع" },
      { en: "Needs work", ar: "يحتاج إصلاح" },
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
  let tags = [...(def.common || [])];
  if (condition) {
    const isNewish = condition === "new" || condition === "like_new";
    const isWorn = condition === "fair" || condition === "poor";
    if (isNewish) {
      tags = tags.concat(def.newish || []);
    } else {
      tags = tags.concat(def.used || []);
      if (isWorn) tags = tags.concat(def.worn || []);
    }
  } else {
    tags = tags.concat(def.newish || [], def.used || [], def.worn || []);
  }
  for (const s of subs) {
    const extra = (def.subcats && def.subcats[s]) || [];
    tags = tags.concat(extra);
  }
  // Deduplicate by the stored `en` key.
  const seen = new Set();
  tags = tags.filter((t) => {
    if (seen.has(t.en)) return false;
    seen.add(t.en);
    return true;
  });
  return tags.map(({ en, ar }) => ({ en, ar }));
}

export function localizeListingTag(value, lang) {
  for (const cat of Object.keys(LISTING_TAGS)) {
    const def = LISTING_TAGS[cat];
    const all = [
      ...(def.common || []),
      ...(def.newish || []),
      ...(def.used || []),
      ...(def.worn || []),
      ...Object.values(def.subcats || {}).flat(),
    ];
    const found = all.find((t) => t.en === value);
    if (found) return lang === "ar" ? found.ar : found.en;
  }
  return value;
}