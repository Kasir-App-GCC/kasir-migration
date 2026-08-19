// Quick-detail tags a seller can attach to a listing. The set returned is
// driven by ALL THREE choices the seller made above:
//   1) category
//   2) subcategory (the primary driver — each subcategory has its own tags)
//   3) condition  → new/like_new → "new" group, excellent/good → "used",
//                   fair/poor → "worn"
// So switching the condition visibly changes the chips (e.g. Phones + new
// shows "With charger / Warranty"; Phones + good shows "Some scratches
// visible / Battery 90%+"). No tag restates a condition enum value, and there
// are no shipping/delivery tags (the platform does not offer shipping).
// Values are stored as the `en` key; localizeListingTag() maps back to the
// active language for display on the item detail page.

const LISTING_TAGS = {
  electronics: {
    _default: {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "With charger", ar: "مع الشاحن" },
      ],
      used: [
        { en: "Tested & working", ar: "مجرّب وشغّال" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "Sold as-is", ar: "يباع كحالته" },
        { en: "Battery weak", ar: "بطارية ضعيفة" },
      ],
    },
    Phones: {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Sealed", ar: "مختوم" },
      ],
      used: [
        { en: "Some scratches visible", ar: "فيه خدوش ظاهرة" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
        { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
        { en: "No scratches", ar: "بلا خدوش" },
      ],
      worn: [
        { en: "Cracked screen", ar: "شاشة مشروخة" },
        { en: "Battery weak", ar: "بطارية ضعيفة" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    Laptops: {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Sealed", ar: "مختوم" },
      ],
      used: [
        { en: "Minor scratches", ar: "خدوش بسيطة" },
        { en: "RAM upgraded", ar: "ذاكرة مطوّرة" },
        { en: "SSD", ar: "قرص SSD" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
      ],
      worn: [
        { en: "Cracked body", ar: "جسم مشروخ" },
        { en: "Battery weak", ar: "بطارية ضعيفة" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    Tablets: {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Cellular", ar: "خلوي" },
      ],
      used: [
        { en: "Minor scratches", ar: "خدوش بسيطة" },
        { en: "Cellular", ar: "خلوي" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
      ],
      worn: [
        { en: "Cracked screen", ar: "شاشة مشروخة" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    "TVs & Screens": {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Wall mount included", ar: "حامل جداري مشمول" },
      ],
      used: [
        { en: "No scratches", ar: "بلا خدوش" },
        { en: "Wall mount included", ar: "حامل جداري مشمول" },
        { en: "Remote included", ar: "ريموت مشمول" },
      ],
      worn: [
        { en: "Dead pixels", ar: "نقاط ميتة" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    Audio: {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Case included", ar: "جراب مشمول" },
      ],
      used: [
        { en: "Minor scratches", ar: "خدوش بسيطة" },
        { en: "Case included", ar: "جراب مشمول" },
        { en: "All accessories", ar: "كل الملحقات" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "Sold as-is", ar: "يباع كحالته" },
      ],
    },
    Gaming: {
      new: [
        { en: "With original box", ar: "علبة أصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Extra controller", ar: "يد إضافية" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Extra controller", ar: "يد إضافية" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "Disc reader issue", ar: "مشكلة قارئ الأقراص" },
      ],
    },
    Accessories: {
      new: [
        { en: "With original packaging", ar: "تغليف أصلي" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Genuine", ar: "أصلي" },
      ],
      used: [
        { en: "Genuine", ar: "أصلي" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
        { en: "Working", ar: "شغّال" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "Sold as-is", ar: "يباع كحالته" },
      ],
    },
  },
  cars: {
    _default: {
      new: [
        { en: "Under warranty", ar: "تحت الضمان" },
        { en: "Never registered", ar: "غير مسجّل" },
        { en: "Full service history", ar: "سجل صيانة كامل" },
        { en: "Valid inspection", ar: "فحص ساري" },
      ],
      used: [
        { en: "No accidents", ar: "بلا حوادث" },
        { en: "Low mileage", ar: "ممشور قليل" },
        { en: "Single owner", ar: "مالك واحد" },
        { en: "Valid inspection", ar: "فحص ساري" },
      ],
      worn: [
        { en: "Needs work", ar: "يحتاج إصلاح" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Sedan: {
      new: [
        { en: "Under warranty", ar: "تحت الضمان" },
        { en: "Never registered", ar: "غير مسجّل" },
        { en: "Fuel efficient", ar: "موفر للوقود" },
        { en: "Valid inspection", ar: "فحص ساري" },
      ],
      used: [
        { en: "No accidents", ar: "بلا حوادث" },
        { en: "Low mileage", ar: "ممشور قليل" },
        { en: "Fuel efficient", ar: "موفر للوقود" },
        { en: "Single owner", ar: "مالك واحد" },
      ],
      worn: [
        { en: "Needs work", ar: "يحتاج إصلاح" },
        { en: "High mileage", ar: "ممشور عالي" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    "SUV / 4x4": {
      new: [
        { en: "Under warranty", ar: "تحت الضمان" },
        { en: "Never registered", ar: "غير مسجّل" },
        { en: "4WD", ar: "دفع رباعي" },
        { en: "Off-road ready", ar: "جاهز للطرق الوعرة" },
      ],
      used: [
        { en: "No accidents", ar: "بلا حوادث" },
        { en: "4WD", ar: "دفع رباعي" },
        { en: "Off-road ready", ar: "جاهز للطرق الوعرة" },
        { en: "Low mileage", ar: "ممشور قليل" },
      ],
      worn: [
        { en: "Needs work", ar: "يحتاج إصلاح" },
        { en: "High mileage", ar: "ممشور عالي" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    Motorcycles: {
      new: [
        { en: "Under warranty", ar: "تحت الضمان" },
        { en: "Never registered", ar: "غير مسجّل" },
        { en: "Helmet included", ar: "خوذة مشمولة" },
        { en: "Valid inspection", ar: "فحص ساري" },
      ],
      used: [
        { en: "No accidents", ar: "بلا حوادث" },
        { en: "Low mileage", ar: "ممشور قليل" },
        { en: "Helmet included", ar: "خوذة مشمولة" },
        { en: "Single owner", ar: "مالك واحد" },
      ],
      worn: [
        { en: "Needs work", ar: "يحتاج إصلاح" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    "Parts & Accessories": {
      new: [
        { en: "Genuine part", ar: "قطعة أصلية" },
        { en: "With packaging", ar: "بالتغليف" },
        { en: "Unused", ar: "غير مستخدم" },
        { en: "Genuine", ar: "أصلي" },
      ],
      used: [
        { en: "Genuine part", ar: "قطعة أصلية" },
        { en: "Tested", ar: "مجرّب" },
        { en: "Working", ar: "شغّال" },
        { en: "Used", ar: "مستخدم" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  furniture: {
    _default: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Assembly included", ar: "تركيب مشمول" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Disassembly available", ar: "تفكيك متاح" },
        { en: "Pet-free home", ar: "بيت بلا حيوانات" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "DIY project", ar: "مشروع شخصي" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Sofas: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Washable covers", ar: "أغطية قابلة للغسل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Washable covers", ar: "أغطية قابلة للغسل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Pet-free home", ar: "بيت بلا حيوانات" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "Stains", ar: "بقع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Beds: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Mattress included", ar: "فرشة مشمولة" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Mattress included", ar: "فرشة مشمولة" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Disassembly available", ar: "تفكيك متاح" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "As-is", ar: "كحالته" },
        { en: "For parts", ar: "للقطع" },
      ],
    },
    "Tables & Chairs": {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Extendable", ar: "قابل للتمديد" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Extendable", ar: "قابل للتمديد" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "Wobbly", ar: "مهتز" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Storage: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Adjustable shelves", ar: "رفوف قابلة للتعديل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Adjustable shelves", ar: "رفوف قابلة للتعديل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Disassembly available", ar: "تفكيك متاح" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Decor: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  fashion: {
    _default: {
      new: [
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "In-season", ar: "من الموسم" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Final sale", ar: "بيع نهائي" },
        { en: "No flaws", ar: "بلا عيوب" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "For upcycling", ar: "لإعادة التدوير" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Men: {
      new: [
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "In-season", ar: "من الموسم" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Authentic", ar: "أصلي" },
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Final sale", ar: "بيع نهائي" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "For upcycling", ar: "لإعادة التدوير" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Women: {
      new: [
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "In-season", ar: "من الموسم" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Authentic", ar: "أصلي" },
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Final sale", ar: "بيع نهائي" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "For upcycling", ar: "لإعادة التدوير" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Kids: {
      new: [
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "In-season", ar: "من الموسم" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Authentic", ar: "أصلي" },
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Final sale", ar: "بيع نهائي" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "For upcycling", ar: "لإعادة التدوير" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Shoes: {
      new: [
        { en: "Original box", ar: "علبة أصلية" },
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "In-season", ar: "من الموسم" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "No flaws", ar: "بلا عيوب" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "Sole wear", ar: "تآكل النعل" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Bags: {
      new: [
        { en: "Dust bag included", ar: "كيس حفظ مشمول" },
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "Dust bag included", ar: "كيس حفظ مشمول" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "No flaws", ar: "بلا عيوب" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "For upcycling", ar: "لإعادة التدوير" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Accessories: {
      new: [
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Original tags", ar: "علامة أصلية" },
        { en: "Authentic", ar: "أصلي" },
        { en: "In-season", ar: "من الموسم" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
      ],
      worn: [
        { en: "Needs repair", ar: "يحتاج إصلاح" },
        { en: "For upcycling", ar: "لإعادة التدوير" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  realestate: {
    _default: {
      new: [
        { en: "Never occupied", ar: "غير مأهول" },
        { en: "Furnished", ar: "مفروش" },
        { en: "Available now", ar: "متاح الآن" },
        { en: "Direct owner", ar: "من المالك مباشرة" },
      ],
      used: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Utilities included", ar: "شامل الخدمات" },
        { en: "Parking included", ar: "موقف مشمول" },
        { en: "Elevator", ar: "مصعد" },
      ],
      worn: [
        { en: "Needs renovation", ar: "يحتاج تجديد" },
        { en: "Fixer-upper", ar: "تحت الصيانة" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    "For Sale": {
      new: [
        { en: "Never occupied", ar: "غير مأهول" },
        { en: "Direct owner", ar: "من المالك مباشرة" },
        { en: "No commission", ar: "بدون عمولة" },
        { en: "Available now", ar: "متاح الآن" },
      ],
      used: [
        { en: "Direct owner", ar: "من المالك مباشرة" },
        { en: "No commission", ar: "بدون عمولة" },
        { en: "Utilities included", ar: "شامل الخدمات" },
        { en: "Parking included", ar: "موقف مشمول" },
      ],
      worn: [
        { en: "Needs renovation", ar: "يحتاج تجديد" },
        { en: "Fixer-upper", ar: "تحت الصيانة" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    "For Rent": {
      new: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Available now", ar: "متاح الآن" },
        { en: "Short-term ok", ar: "قصير الأمد" },
        { en: "Direct owner", ar: "من المالك مباشرة" },
      ],
      used: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Utilities included", ar: "شامل الخدمات" },
        { en: "Parking included", ar: "موقف مشمول" },
        { en: "Short-term ok", ar: "قصير الأمد" },
      ],
      worn: [
        { en: "Needs renovation", ar: "يحتاج تجديد" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Apartments: {
      new: [
        { en: "Never occupied", ar: "غير مأهول" },
        { en: "Furnished", ar: "مفروش" },
        { en: "Elevator", ar: "مصعد" },
        { en: "Available now", ar: "متاح الآن" },
      ],
      used: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Utilities included", ar: "شامل الخدمات" },
        { en: "Parking included", ar: "موقف مشمول" },
        { en: "Elevator", ar: "مصعد" },
      ],
      worn: [
        { en: "Needs renovation", ar: "يحتاج تجديد" },
        { en: "Fixer-upper", ar: "تحت الصيانة" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Villas: {
      new: [
        { en: "Never occupied", ar: "غير مأهول" },
        { en: "Furnished", ar: "مفروش" },
        { en: "Maid room", ar: "غرفة عمالة" },
        { en: "Available now", ar: "متاح الآن" },
      ],
      used: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Maid room", ar: "غرفة عمالة" },
        { en: "Utilities included", ar: "شامل الخدمات" },
        { en: "Parking included", ar: "موقف مشمول" },
      ],
      worn: [
        { en: "Needs renovation", ar: "يحتاج تجديد" },
        { en: "Fixer-upper", ar: "تحت الصيانة" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Land: {
      new: [
        { en: "Titled", ar: "مخطّط" },
        { en: "Corner plot", ar: "زاوية" },
        { en: "Available now", ar: "متاح الآن" },
        { en: "Direct owner", ar: "من المالك مباشرة" },
      ],
      used: [
        { en: "Titled", ar: "مخطّط" },
        { en: "Corner plot", ar: "زاوية" },
        { en: "Direct owner", ar: "من المالك مباشرة" },
        { en: "No commission", ar: "بدون عمولة" },
      ],
      worn: [
        { en: "Needs clearing", ar: "يحتاج تنظيف" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  services: {
    _default: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
      ],
      worn: [
        { en: "As-is", ar: "كحالته" },
        { en: "Limited availability", ar: "توفّر محدود" },
      ],
    },
    Cleaning: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "Eco-friendly", ar: "صديق للبيئة" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "First-time discount", ar: "خصم أول طلب" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Eco-friendly", ar: "صديق للبيئة" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      worn: [{ en: "As-is", ar: "كحالته" }],
    },
    Maintenance: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "First-time discount", ar: "خصم أول طلب" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      worn: [{ en: "As-is", ar: "كحالته" }],
    },
    Tutoring: {
      new: [
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Certified", ar: "معتمد" },
        { en: "Online ok", ar: "أونلاين" },
        { en: "Beginner friendly", ar: "للمبتدئين" },
      ],
      used: [
        { en: "Certified", ar: "معتمد" },
        { en: "Online ok", ar: "أونلاين" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "One-on-one", ar: "خصوصي" },
      ],
      worn: [],
    },
    Transport: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "Insured", ar: "مؤمّن" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "First-time discount", ar: "خصم أول طلب" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Insured", ar: "مؤمّن" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
      ],
      worn: [{ en: "As-is", ar: "كحالته" }],
    },
    Events: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      used: [
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
      ],
      worn: [],
    },
  },
  toys: {
    _default: {
      new: [
        { en: "Original packaging", ar: "تغليف أصلي" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Complete set", ar: "طقم كامل" },
        { en: "Gently played with", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Missing pieces", ar: "قطع ناقصة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    "Kids Toys": {
      new: [
        { en: "Original packaging", ar: "تغليف أصلي" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Age-appropriate", ar: "مناسب للعمر" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Age-appropriate", ar: "مناسب للعمر" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Complete set", ar: "طقم كامل" },
      ],
      worn: [
        { en: "Missing pieces", ar: "قطع ناقصة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    "Board Games": {
      new: [
        { en: "Sealed", ar: "مختوم" },
        { en: "Instructions included", ar: "دليل اللعب مشمول" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "All pieces", ar: "كل القطع" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Instructions included", ar: "دليل اللعب مشمول" },
        { en: "Complete set", ar: "طقم كامل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      worn: [
        { en: "Missing pieces", ar: "قطع ناقصة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Collectibles: {
      new: [
        { en: "Original packaging", ar: "تغليف أصلي" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Limited edition", ar: "إصدار محدود" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Limited edition", ar: "إصدار محدود" },
        { en: "Display case included", ar: "علبة عرض مشمولة" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  sports: {
    _default: {
      new: [
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Still tagged", ar: "لا يزال بالبطاقة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Needs maintenance", ar: "يحتاج صيانة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Fitness: {
      new: [
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Folds flat", ar: "قابل للطي" },
        { en: "Still tagged", ar: "لا يزال بالبطاقة" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Folds flat", ar: "قابل للطي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Needs maintenance", ar: "يحتاج صيانة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Bicycles: {
      new: [
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Helmet included", ar: "خوذة مشمولة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Still tagged", ar: "لا يزال بالبطاقة" },
      ],
      used: [
        { en: "Helmet included", ar: "خوذة مشمولة" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
        { en: "All accessories", ar: "كل الملحقات" },
      ],
      worn: [
        { en: "Needs maintenance", ar: "يحتاج صيانة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    "Team Sports": {
      new: [
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Full set", ar: "طقم كامل" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Still tagged", ar: "لا يزال بالبطاقة" },
      ],
      used: [
        { en: "Full set", ar: "طقم كامل" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Outdoor: {
      new: [
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
        { en: "Still tagged", ar: "لا يزال بالبطاقة" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Needs maintenance", ar: "يحتاج صيانة" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  books: {
    _default: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "First edition", ar: "الطبعة الأولى" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Textbooks: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Edition noted", ar: "الطبعة مذكورة" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Edition noted", ar: "الطبعة مذكورة" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Novels: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "First edition", ar: "الطبعة الأولى" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Religious: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
        { en: "First edition", ar: "الطبعة الأولى" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Children: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Illustrated", ar: "مصوّر" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Illustrated", ar: "مصوّر" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  animals: {
    _default: {
      new: [
        { en: "Vaccinated", ar: "مطعّم" },
        { en: "Young", ar: "صغير السن" },
        { en: "With supplies", ar: "مع المستلزمات" },
        { en: "Healthy", ar: "سليم" },
      ],
      used: [
        { en: "Trained", ar: "مدرّب" },
        { en: "Healthy", ar: "سليم" },
        { en: "With supplies", ar: "مع المستلزمات" },
        { en: "Tame", ar: "أليف" },
      ],
      worn: [
        { en: "Needs care", ar: "يحتاج رعاية" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Livestock: {
      new: [
        { en: "Vaccinated", ar: "مطعّم" },
        { en: "Young", ar: "صغير السن" },
        { en: "Grass-fed", ar: "تغذية طبيعية" },
        { en: "Healthy", ar: "سليم" },
      ],
      used: [
        { en: "Grass-fed", ar: "تغذية طبيعية" },
        { en: "Healthy", ar: "سليم" },
        { en: "Trained", ar: "مدرّب" },
        { en: "Tame", ar: "أليف" },
      ],
      worn: [
        { en: "Needs care", ar: "يحتاج رعاية" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Pets: {
      new: [
        { en: "Vaccinated", ar: "مطعّم" },
        { en: "Young", ar: "صغير السن" },
        { en: "Microchipped", ar: "بشريحة تعريف" },
        { en: "With supplies", ar: "مع المستلزمات" },
      ],
      used: [
        { en: "Trained", ar: "مدرّب" },
        { en: "Microchipped", ar: "بشريحة تعريف" },
        { en: "Tame", ar: "أليف" },
        { en: "Healthy", ar: "سليم" },
      ],
      worn: [
        { en: "Needs care", ar: "يحتاج رعاية" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Birds: {
      new: [
        { en: "Vaccinated", ar: "مطعّم" },
        { en: "Young", ar: "صغير السن" },
        { en: "Cage included", ar: "قفص مشمول" },
        { en: "Healthy", ar: "سليم" },
      ],
      used: [
        { en: "Cage included", ar: "قفص مشمول" },
        { en: "Trained", ar: "مدرّب" },
        { en: "Tame", ar: "أليف" },
        { en: "Healthy", ar: "سليم" },
      ],
      worn: [
        { en: "Needs care", ar: "يحتاج رعاية" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Fish: {
      new: [
        { en: "Young", ar: "صغير السن" },
        { en: "Tank included", ar: "حوض مشمول" },
        { en: "Healthy", ar: "سليم" },
        { en: "With supplies", ar: "مع المستلزمات" },
      ],
      used: [
        { en: "Tank included", ar: "حوض مشمول" },
        { en: "Healthy", ar: "سليم" },
        { en: "With supplies", ar: "مع المستلزمات" },
        { en: "Tame", ar: "أليف" },
      ],
      worn: [
        { en: "Needs care", ar: "يحتاج رعاية" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Supplies: {
      new: [
        { en: "Sealed", ar: "مختوم" },
        { en: "Starter kit", ar: "حقيبة بداية" },
        { en: "Genuine", ar: "أصلي" },
        { en: "Unused", ar: "غير مستخدم" },
      ],
      used: [
        { en: "Starter kit", ar: "حقيبة بداية" },
        { en: "Working", ar: "شغّال" },
        { en: "Genuine", ar: "أصلي" },
        { en: "Used", ar: "مستخدم" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  jobs: {
    _default: {
      new: [
        { en: "Entry level", ar: "للمبتدئين" },
        { en: "Training provided", ar: "تدريب مشمول" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Immediate start", ar: "بدء فوري" },
      ],
      used: [
        { en: "Experience required", ar: "يتطلب خبرة" },
        { en: "Visa provided", ar: "إقامة مشمولة" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Immediate start", ar: "بدء فوري" },
      ],
      worn: [],
    },
    "Full-time": {
      new: [
        { en: "Entry level", ar: "للمبتدئين" },
        { en: "Training provided", ar: "تدريب مشمول" },
        { en: "Visa provided", ar: "إقامة مشمولة" },
        { en: "Immediate start", ar: "بدء فوري" },
      ],
      used: [
        { en: "Experience required", ar: "يتطلب خبرة" },
        { en: "Visa provided", ar: "إقامة مشمولة" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Flexible hours", ar: "ساعات مرنة" },
      ],
      worn: [],
    },
    "Part-time": {
      new: [
        { en: "Entry level", ar: "للمبتدئين" },
        { en: "Training provided", ar: "تدريب مشمول" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Flexible hours", ar: "ساعات مرنة" },
      ],
      used: [
        { en: "Experience required", ar: "يتطلب خبرة" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Flexible hours", ar: "ساعات مرنة" },
        { en: "Immediate start", ar: "بدء فوري" },
      ],
      worn: [],
    },
    Freelance: {
      new: [
        { en: "Portfolio available", ar: "أعمال جاهزة" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Flexible hours", ar: "ساعات مرنة" },
        { en: "Immediate start", ar: "بدء فوري" },
      ],
      used: [
        { en: "Portfolio available", ar: "أعمال جاهزة" },
        { en: "Experience required", ar: "يتطلب خبرة" },
        { en: "Remote ok", ar: "عن بُعد" },
        { en: "Flexible hours", ar: "ساعات مرنة" },
      ],
      worn: [],
    },
  },
  education: {
    _default: {
      new: [
        { en: "Free trial", ar: "تجربة مجانية" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Certified", ar: "معتمد" },
        { en: "Beginner friendly", ar: "للمبتدئين" },
      ],
      used: [
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Group ok", ar: "جماعي" },
        { en: "One-on-one", ar: "خصوصي" },
      ],
      worn: [],
    },
    Tutoring: {
      new: [
        { en: "Free trial", ar: "تجربة مجانية" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Certified", ar: "معتمد" },
        { en: "One-on-one", ar: "خصوصي" },
      ],
      used: [
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "One-on-one", ar: "خصوصي" },
        { en: "Online ok", ar: "أونلاين" },
      ],
      worn: [],
    },
    Courses: {
      new: [
        { en: "Free trial", ar: "تجربة مجانية" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Certified", ar: "معتمد" },
        { en: "Completion certificate", ar: "شهادة إتمام" },
      ],
      used: [
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Completion certificate", ar: "شهادة إتمام" },
        { en: "Group ok", ar: "جماعي" },
      ],
      worn: [],
    },
    Training: {
      new: [
        { en: "Free trial", ar: "تجربة مجانية" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Certified", ar: "معتمد" },
        { en: "Beginner friendly", ar: "للمبتدئين" },
      ],
      used: [
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Group ok", ar: "جماعي" },
        { en: "One-on-one", ar: "خصوصي" },
      ],
      worn: [],
    },
  },
  occasions: {
    _default: {
      new: [
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Sample available", ar: "عيّنة متاحة" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      worn: [],
    },
    Weddings: {
      new: [
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Sample available", ar: "عيّنة متاحة" },
        { en: "Booking required", ar: "يتطلب حجز" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      worn: [],
    },
    Parties: {
      new: [
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Sample available", ar: "عيّنة متاحة" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
      ],
      used: [
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      worn: [],
    },
    Catering: {
      new: [
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "Tasting available", ar: "تذوق متاح" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Sample available", ar: "عيّنة متاحة" },
      ],
      used: [
        { en: "Tasting available", ar: "تذوق متاح" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
      ],
      worn: [],
    },
    Rentals: {
      new: [
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
      ],
      used: [
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
      ],
      worn: [],
    },
  },
  antiques: {
    _default: {
      new: [
        { en: "With certificate", ar: "مع شهادة" },
        { en: "Appraised", ar: "مقيّم" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Rare", ar: "نادر" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "No restoration", ar: "بدون ترميم" },
        { en: "Aged patina", ar: "باتينا زمنية" },
        { en: "Rare", ar: "نادر" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "Restorable", ar: "قابل للترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Coins: {
      new: [
        { en: "With certificate", ar: "مع شهادة" },
        { en: "Graded", ar: "مصنّف" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Rare", ar: "نادر" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "Graded", ar: "مصنّف" },
        { en: "Aged patina", ar: "باتينا زمنية" },
        { en: "Rare", ar: "نادر" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Heritage: {
      new: [
        { en: "With certificate", ar: "مع شهادة" },
        { en: "Museum quality", ar: "جودة متحفية" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Appraised", ar: "مقيّم" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "Museum quality", ar: "جودة متحفية" },
        { en: "No restoration", ar: "بدون ترميم" },
        { en: "Aged patina", ar: "باتينا زمنية" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "Restorable", ar: "قابل للترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Collectibles: {
      new: [
        { en: "With certificate", ar: "مع شهادة" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Rare", ar: "نادر" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "No restoration", ar: "بدون ترميم" },
        { en: "Aged patina", ar: "باتينا زمنية" },
        { en: "Rare", ar: "نادر" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  arts: {
    _default: {
      new: [
        { en: "Signed", ar: "موقّع" },
        { en: "Limited edition", ar: "إصدار محدود" },
        { en: "Framed", ar: "مؤطر" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Framed", ar: "مؤطر" },
        { en: "Hand-carved", ar: "حفر يدوي" },
        { en: "Stretched canvas", ar: "كانفس مشدود" },
        { en: "Original", ar: "أصلي" },
      ],
      worn: [
        { en: "Needs reframing", ar: "يحتاج تأطير" },
        { en: "Restorable", ar: "قابل للترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Paintings: {
      new: [
        { en: "Signed", ar: "موقّع" },
        { en: "Limited edition", ar: "إصدار محدود" },
        { en: "Framed", ar: "مؤطر" },
        { en: "Stretched canvas", ar: "كانفس مشدود" },
      ],
      used: [
        { en: "Framed", ar: "مؤطر" },
        { en: "Stretched canvas", ar: "كانفس مشدود" },
        { en: "Original", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Needs reframing", ar: "يحتاج تأطير" },
        { en: "Restorable", ar: "قابل للترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Handicrafts: {
      new: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Signed", ar: "موقّع" },
        { en: "Limited edition", ar: "إصدار محدود" },
      ],
      used: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Hand-carved", ar: "حفر يدوي" },
        { en: "Original", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "Restorable", ar: "قابل للترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
    Calligraphy: {
      new: [
        { en: "Hand-carved", ar: "حفر يدوي" },
        { en: "Signed", ar: "موقّع" },
        { en: "Framed", ar: "مؤطر" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Hand-carved", ar: "حفر يدوي" },
        { en: "Framed", ar: "مؤطر" },
        { en: "Original", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Needs reframing", ar: "يحتاج تأطير" },
        { en: "Restorable", ar: "قابل للترميم" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
  families: {
    _default: {
      new: [
        { en: "Fresh", ar: "طازج" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
        { en: "Made to order", ar: "حسب الطلب" },
      ],
      worn: [],
    },
    Food: {
      new: [
        { en: "Fresh", ar: "طازج" },
        { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Fresh", ar: "طازج" },
        { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      worn: [],
    },
    "Bakery & Sweets": {
      new: [
        { en: "Fresh", ar: "طازج" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Sugar-free option", ar: "خيار بلا سكر" },
        { en: "Family-made", ar: "منتج أسري" },
      ],
      used: [
        { en: "Fresh", ar: "طازج" },
        { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
        { en: "Sugar-free option", ar: "خيار بلا سكر" },
        { en: "Family-made", ar: "منتج أسري" },
      ],
      worn: [],
    },
    "Perfumes & Oud": {
      new: [
        { en: "Long-lasting", ar: "ثبات عالي" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Long-lasting", ar: "ثبات عالي" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Sample available", ar: "عيّنة متاحة" },
      ],
      worn: [],
    },
    Handicrafts: {
      new: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Made to order", ar: "حسب الطلب" },
      ],
      worn: [],
    },
    Clothing: {
      new: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Made to order", ar: "حسب الطلب" },
      ],
      worn: [],
    },
  },
  other: {
    _default: {
      new: [
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "As-is", ar: "كحالته" },
      ],
      worn: [
        { en: "For parts", ar: "للقطع" },
        { en: "Needs work", ar: "يحتاج إصلاح" },
        { en: "As-is", ar: "كحالته" },
      ],
    },
  },
};

function groupFor(condition) {
  if (!condition) return null;
  if (condition === "new" || condition === "like_new") return "new";
  if (condition === "excellent" || condition === "good") return "used";
  return "worn"; // fair, poor
}

export function getListingTags(category, subcategory, condition) {
  const cat = LISTING_TAGS[category];
  if (!cat) return [];
  const subs = Array.isArray(subcategory)
    ? subcategory
    : subcategory
      ? [subcategory]
      : [];
  const group = groupFor(condition);
  const targets = subs.length ? subs : ["_default"];
  let tags = [];
  for (const s of targets) {
    const def = cat[s] || cat._default;
    if (!def) continue;
    if (group) {
      tags = tags.concat(def[group] || []);
    } else {
      tags = tags.concat(def.new || [], def.used || [], def.worn || []);
    }
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
    const subs = LISTING_TAGS[cat];
    for (const subKey of Object.keys(subs)) {
      const groups = subs[subKey];
      for (const g of ["new", "used", "worn"]) {
        const found = (groups[g] || []).find((t) => t.en === value);
        if (found) return lang === "ar" ? found.ar : found.en;
      }
    }
  }
  return value;
}