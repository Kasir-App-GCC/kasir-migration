// Quick-detail tags a seller can attach to a listing. The set returned is
// driven by ALL THREE choices the seller made above:
//   1) category   2) subcategory   3) condition
//      new / like_new → "new" group (what's included / extras)
//      excellent / good → "used" group (light wear / honest specifics)
//      fair / poor → "worn" group (concrete damage a buyer must know)
// The point is to save the seller typing these into the description. So tags
// are concrete attributes/flaws, never obvious filler like "As-is" or "For
// parts", and never a restated condition enum. No shipping/delivery tags.
// Values are stored as the `en` key; localizeListingTag() maps back to the
// active language for display on the item detail page.

const LISTING_TAGS = {
  electronics: {
    _default: {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Sealed", ar: "مختوم" },
      ],
      used: [
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
        { en: "Tested & working", ar: "مجرّب وشغّال" },
      ],
      worn: [
        { en: "Heavy scratches", ar: "خدوش كثيرة" },
        { en: "Battery weak", ar: "بطارية ضعيفة" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    Phones: {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Sealed", ar: "مختوم" },
      ],
      used: [
        { en: "No scratches", ar: "بلا خدوش" },
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
        { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
      ],
      worn: [
        { en: "Cracked screen", ar: "شاشة مشروخة" },
        { en: "Cracked back", ar: "الظهر مكسور" },
        { en: "Battery needs replacement", ar: "البطارية تحتاج تغيير" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    Laptops: {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Sealed", ar: "مختوم" },
      ],
      used: [
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "RAM upgraded", ar: "ذاكرة مطوّرة" },
        { en: "SSD", ar: "قرص SSD" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
      ],
      worn: [
        { en: "Cracked body", ar: "جسم مكسور" },
        { en: "Broken hinge", ar: "الوصلة مكسورة" },
        { en: "Battery weak", ar: "بطارية ضعيفة" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    Tablets: {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "With charger", ar: "مع الشاحن" },
        { en: "Cellular", ar: "خلوي" },
      ],
      used: [
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "Cellular", ar: "خلوي" },
        { en: "Battery 90%+", ar: "بطارية 90% فأكثر" },
        { en: "With charger", ar: "مع الشاحن" },
      ],
      worn: [
        { en: "Cracked screen", ar: "شاشة مشروخة" },
        { en: "Battery weak", ar: "بطارية ضعيفة" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    "TVs & Screens": {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Wall mount included", ar: "حامل جداري مشمول" },
      ],
      used: [
        { en: "No scratches", ar: "بلا خدوش" },
        { en: "Remote included", ar: "ريموت مشمول" },
        { en: "Stand included", ar: "قاعدة مشمولة" },
        { en: "Wall mount included", ar: "حامل جداري مشمول" },
      ],
      worn: [
        { en: "Dead pixels", ar: "نقاط ميتة" },
        { en: "Screen burn", ar: "احتراق الشاشة" },
        { en: "Lines on screen", ar: "خطوط على الشاشة" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    Audio: {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Case included", ar: "جراب مشمول" },
      ],
      used: [
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "Case included", ar: "جراب مشمول" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Working", ar: "شغّال" },
      ],
      worn: [
        { en: "One side not working", ar: "جهة واحدة لا تعمل" },
        { en: "Crackling sound", ar: "صوت طقطقة" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    Gaming: {
      new: [
        { en: "With original box", ar: "بالعلبة الأصلية" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Extra controller", ar: "يد إضافية" },
      ],
      used: [
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Extra controller", ar: "يد إضافية" },
        { en: "Working", ar: "شغّال" },
      ],
      worn: [
        { en: "Disc reader issue", ar: "مشكلة في قارئ الأقراص" },
        { en: "Overheating", ar: "يسخن بسرعة" },
        { en: "Joystick drift", ar: "انحراف اليد" },
        { en: "Non-functional", ar: "متعطل" },
      ],
    },
    Accessories: {
      new: [
        { en: "With original packaging", ar: "بالتغليف الأصلي" },
        { en: "With warranty", ar: "عليه ضمان" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Genuine", ar: "أصلي" },
      ],
      used: [
        { en: "Light scratches", ar: "خدوش بسيطة" },
        { en: "Genuine", ar: "أصلي" },
        { en: "Working", ar: "شغّال" },
        { en: "Compatible", ar: "متوافق" },
      ],
      worn: [
        { en: "Frayed cable", ar: "كابل متآكل" },
        { en: "Broken connector", ar: "موصل مكسور" },
        { en: "Non-functional", ar: "متعطل" },
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
        { en: "Full service history", ar: "سجل صيانة كامل" },
      ],
      worn: [
        { en: "High mileage", ar: "ممشور عالي" },
        { en: "Minor dents", ar: "انبعاجات بسيطة" },
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Engine issue", ar: "مشكلة في المحرك" },
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
        { en: "Single owner", ar: "مالك واحد" },
        { en: "Fuel efficient", ar: "موفر للوقود" },
      ],
      worn: [
        { en: "High mileage", ar: "ممشور عالي" },
        { en: "Minor dents", ar: "انبعاجات بسيطة" },
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Engine issue", ar: "مشكلة في المحرك" },
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
        { en: "Low mileage", ar: "ممشور قليل" },
        { en: "4WD", ar: "دفع رباعي" },
        { en: "Off-road ready", ar: "جاهز للطرق الوعرة" },
      ],
      worn: [
        { en: "High mileage", ar: "ممشور عالي" },
        { en: "Minor dents", ar: "انبعاجات بسيطة" },
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Engine issue", ar: "مشكلة في المحرك" },
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
        { en: "Single owner", ar: "مالك واحد" },
        { en: "Helmet included", ar: "خوذة مشمولة" },
      ],
      worn: [
        { en: "High mileage", ar: "ممشور عالي" },
        { en: "Scratches on frame", ar: "خدوش على الهيكل" },
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Engine issue", ar: "مشكلة في المحرك" },
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
        { en: "Worn", ar: "مهترئ" },
        { en: "For repair", ar: "للإصلاح" },
        { en: "Compatible only", ar: "متوافق فقط" },
      ],
    },
  },
  furniture: {
    _default: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Assembly included", ar: "تركيب مشمول" },
      ],
      used: [
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Pet-free home", ar: "بيت بلا حيوانات" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Stains", ar: "بقع" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Loose frame", ar: "الهيكل مرتخي" },
        { en: "Needs restoration", ar: "يحتاج ترميم" },
      ],
    },
    Sofas: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Washable covers", ar: "أغطية قابلة للغسل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Washable covers", ar: "أغطية قابلة للغسل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Firm cushions", ar: "وسائد متماسكة" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "Stains", ar: "بقع" },
        { en: "Torn upholstery", ar: "التنجيد ممزق" },
        { en: "Sagging cushions", ar: "وسائد مترهلة" },
        { en: "Needs reupholstering", ar: "يحتاج إعادة تنجيد" },
      ],
    },
    Beds: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Mattress included", ar: "فرشة مشمولة" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Mattress included", ar: "فرشة مشمولة" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Disassembly available", ar: "تفكيك متاح" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Stains", ar: "بقع" },
        { en: "Sagging", ar: "ترهّل" },
        { en: "Broken slats", ar: "قوائم مكسورة" },
        { en: "Torn fabric", ar: "قماش ممزق" },
      ],
    },
    "Tables & Chairs": {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Extendable", ar: "قابل للتمديد" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Extendable", ar: "قابل للتمديد" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Sturdy", ar: "متين" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "Wobbly", ar: "مهتز" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Chipped edges", ar: "حواف متكسرة" },
        { en: "Loose joints", ar: "مفاصل مرتخية" },
      ],
    },
    Storage: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Adjustable shelves", ar: "رفوف قابلة للتعديل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Adjustable shelves", ar: "رفوف قابلة للتعديل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Disassembly available", ar: "تفكيك متاح" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "Scratches", ar: "خدوش" },
        { en: "Dented", ar: "منبعج" },
        { en: "Broken hinges", ar: "مفصلات مكسورة" },
        { en: "Missing shelves", ar: "رفوف ناقصة" },
      ],
    },
    Decor: {
      new: [
        { en: "Still in packaging", ar: "لا يزال بالتغليف" },
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Minor scratches", ar: "خدوش بسيطة" },
      ],
      worn: [
        { en: "Chips", ar: "تكسرات" },
        { en: "Faded color", ar: "اللون باهت" },
        { en: "Cracked", ar: "مشروخ" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
      ],
    },
  },
  fashion: {
    _default: {
      new: [
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Unworn", ar: "غير ملبوس" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Smoke-free", ar: "بلا تدخين" },
      ],
      worn: [
        { en: "Visible rips", ar: "تمزق ظاهر" },
        { en: "Stains", ar: "بقع" },
        { en: "Faded color", ar: "اللون باهت" },
        { en: "Missing buttons", ar: "أزرار ناقصة" },
        { en: "Broken zipper", ar: "سحّاب مكسور" },
      ],
    },
    Men: {
      new: [
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Unworn", ar: "غير ملبوس" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Smoke-free", ar: "بلا تدخين" },
      ],
      worn: [
        { en: "Visible rips", ar: "تمزق ظاهر" },
        { en: "Stains", ar: "بقع" },
        { en: "Faded color", ar: "اللون باهت" },
        { en: "Missing buttons", ar: "أزرار ناقصة" },
        { en: "Broken zipper", ar: "سحّاب مكسور" },
      ],
    },
    Women: {
      new: [
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Unworn", ar: "غير ملبوس" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Smoke-free", ar: "بلا تدخين" },
      ],
      worn: [
        { en: "Visible rips", ar: "تمزق ظاهر" },
        { en: "Stains", ar: "بقع" },
        { en: "Faded color", ar: "اللون باهت" },
        { en: "Missing buttons", ar: "أزرار ناقصة" },
        { en: "Broken zipper", ar: "سحّاب مكسور" },
      ],
    },
    Kids: {
      new: [
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Unworn", ar: "غير ملبوس" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Smoke-free", ar: "بلا تدخين" },
      ],
      worn: [
        { en: "Visible rips", ar: "تمزق ظاهر" },
        { en: "Stains", ar: "بقع" },
        { en: "Faded color", ar: "اللون باهت" },
        { en: "Missing buttons", ar: "أزرار ناقصة" },
        { en: "Broken zipper", ar: "سحّاب مكسور" },
      ],
    },
    Shoes: {
      new: [
        { en: "Original box", ar: "بالعلبة الأصلية" },
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Unworn", ar: "غير ملبوس" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Smoke-free", ar: "بلا تدخين" },
      ],
      worn: [
        { en: "Sole wear", ar: "تآكل النعل" },
        { en: "Visible rips", ar: "تمزق ظاهر" },
        { en: "Scuffs", ar: "حكّات" },
        { en: "Broken sole", ar: "النعل مكسور" },
        { en: "Worn insoles", ar: "نعل داخلي مهترئ" },
      ],
    },
    Bags: {
      new: [
        { en: "Dust bag included", ar: "كيس حفظ مشمول" },
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "Dust bag included", ar: "كيس حفظ مشمول" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
      ],
      worn: [
        { en: "Scratches", ar: "خدوش" },
        { en: "Torn lining", ar: "البطانة ممزقة" },
        { en: "Broken zipper", ar: "سحّاب مكسور" },
        { en: "Faded hardware", ar: "الإكسسوارات باهتة" },
        { en: "Stains", ar: "بقع" },
      ],
    },
    Accessories: {
      new: [
        { en: "Gift-boxed", ar: "علبة إهداء" },
        { en: "Original tags", ar: "بالعلامة الأصلية" },
        { en: "Unworn", ar: "غير مستخدم" },
        { en: "Authentic", ar: "أصلي" },
      ],
      used: [
        { en: "No flaws", ar: "بلا عيوب" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "From a clean closet", ar: "من خزانة نظيفة" },
        { en: "Authentic", ar: "أصلي" },
      ],
      worn: [
        { en: "Tarnished", ar: "مطعّج" },
        { en: "Broken clasp", ar: "القفل مكسور" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Faded", ar: "باهت" },
        { en: "Missing stones", ar: "أحجار ناقصة" },
      ],
    },
  },
  realestate: {
    _default: {
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
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Old plumbing", ar: "سباكة قديمة" },
        { en: "Fixer-upper", ar: "تحت الصيانة" },
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
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Old plumbing", ar: "سباكة قديمة" },
        { en: "Fixer-upper", ar: "تحت الصيانة" },
      ],
    },
    "For Rent": {
      new: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Never occupied", ar: "غير مأهول" },
        { en: "Short-term ok", ar: "قصير الأمد" },
        { en: "Available now", ar: "متاح الآن" },
      ],
      used: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Utilities included", ar: "شامل الخدمات" },
        { en: "Parking included", ar: "موقف مشمول" },
        { en: "Short-term ok", ar: "قصير الأمد" },
      ],
      worn: [
        { en: "Needs renovation", ar: "يحتاج تجديد" },
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Old AC", ar: "مكيف قديم" },
        { en: "Damp", ar: "رطوبة" },
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
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Old plumbing", ar: "سباكة قديمة" },
        { en: "Damp", ar: "رطوبة" },
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
        { en: "Needs paint", ar: "يحتاج صبغ" },
        { en: "Old AC", ar: "مكيف قديم" },
        { en: "Cracks", ar: "شقوق" },
      ],
    },
    Land: {
      new: [
        { en: "Titled", ar: "مخطّط" },
        { en: "Corner plot", ar: "زاوية" },
        { en: "Direct owner", ar: "من المالك مباشرة" },
        { en: "Available now", ar: "متاح الآن" },
      ],
      used: [
        { en: "Titled", ar: "مخطّط" },
        { en: "Corner plot", ar: "زاوية" },
        { en: "Walled", ar: "مسيّج" },
        { en: "No commission", ar: "بدون عمولة" },
      ],
      worn: [
        { en: "Needs clearing", ar: "يحتاج تنظيف" },
        { en: "Uneven", ar: "غير مستوي" },
        { en: "No utilities", ar: "بلا خدمات" },
        { en: "Untitled", ar: "غير مخطّط" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
      ],
      worn: [
        { en: "Limited availability", ar: "توفّر محدود" },
        { en: "By appointment", ar: "بموعد مسبق" },
      ],
    },
    Cleaning: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "Eco-friendly", ar: "صديق للبيئة" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      used: [
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Eco-friendly", ar: "صديق للبيئة" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
      ],
      worn: [
        { en: "Limited availability", ar: "توفّر محدود" },
        { en: "By appointment", ar: "بموعد مسبق" },
      ],
    },
    Maintenance: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      used: [
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Mobile service", ar: "خدمة متنقلة" },
        { en: "Warranty on work", ar: "ضمان على العمل" },
      ],
      worn: [
        { en: "Limited availability", ar: "توفّر محدود" },
        { en: "By appointment", ar: "بموعد مسبق" },
      ],
    },
    Tutoring: {
      new: [
        { en: "Free trial", ar: "تجربة مجانية" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Certified", ar: "معتمد" },
        { en: "Beginner friendly", ar: "للمبتدئين" },
      ],
      used: [
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "One-on-one", ar: "خصوصي" },
      ],
      worn: [
        { en: "Group only", ar: "جماعي فقط" },
        { en: "Online only", ar: "أونلاين فقط" },
      ],
    },
    Transport: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Insured", ar: "مؤمّن" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      used: [
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Insured", ar: "مؤمّن" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      worn: [
        { en: "Limited availability", ar: "توفّر محدود" },
        { en: "By appointment", ar: "بموعد مسبق" },
      ],
    },
    Events: {
      new: [
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "All-inclusive", ar: "شامل الكل" },
        { en: "First-time discount", ar: "خصم أول طلب" },
        { en: "Licensed", ar: "مرخّص" },
      ],
      used: [
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
      ],
      worn: [
        { en: "Limited availability", ar: "توفّر محدود" },
        { en: "By appointment", ar: "بموعد مسبق" },
      ],
    },
  },
  toys: {
    _default: {
      new: [
        { en: "Original packaging", ar: "بالتغليف الأصلي" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Age-appropriate", ar: "مناسب للعمر" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Complete set", ar: "طقم كامل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gently played with", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Missing pieces", ar: "قطع ناقصة" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Broken parts", ar: "أجزاء مكسورة" },
        { en: "Faded", ar: "باهت" },
      ],
    },
    "Kids Toys": {
      new: [
        { en: "Original packaging", ar: "بالتغليف الأصلي" },
        { en: "Sealed", ar: "مختوم" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Age-appropriate", ar: "مناسب للعمر" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Complete set", ar: "طقم كامل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
        { en: "Gently played with", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Missing pieces", ar: "قطع ناقصة" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Broken parts", ar: "أجزاء مكسورة" },
        { en: "Faded", ar: "باهت" },
      ],
    },
    "Board Games": {
      new: [
        { en: "Sealed", ar: "مختوم" },
        { en: "Instructions included", ar: "دليل اللعب مشمول" },
        { en: "All pieces", ar: "كل القطع" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "All pieces", ar: "كل القطع" },
        { en: "Instructions included", ar: "دليل اللعب مشمول" },
        { en: "Complete set", ar: "طقم كامل" },
        { en: "Smoke-free home", ar: "بيت بلا تدخين" },
      ],
      worn: [
        { en: "Missing pieces", ar: "قطع ناقصة" },
        { en: "Worn box", ar: "العلبة مهترئة" },
        { en: "Missing instructions", ar: "الدليل ناقص" },
        { en: "Damaged cards", ar: "بطاقات تالفة" },
      ],
    },
    Collectibles: {
      new: [
        { en: "Original packaging", ar: "بالتغليف الأصلي" },
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
        { en: "Scratches", ar: "خدوش" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
        { en: "Faded", ar: "باهت" },
        { en: "Damaged box", ar: "علبة تالفة" },
      ],
    },
  },
  sports: {
    _default: {
      new: [
        { en: "Still tagged", ar: "بالبطاقة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
      ],
      worn: [
        { en: "Rust", ar: "صدأ" },
        { en: "Torn grip", ar: "المقبض ممزق" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
        { en: "Squeaky", ar: "يصدر صوت" },
      ],
    },
    Fitness: {
      new: [
        { en: "Still tagged", ar: "بالبطاقة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Folds flat", ar: "قابل للطي" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Folds flat", ar: "قابل للطي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Rust", ar: "صدأ" },
        { en: "Torn grip", ar: "المقبض ممزق" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
        { en: "Squeaky", ar: "يصدر صوت" },
      ],
    },
    Bicycles: {
      new: [
        { en: "Still tagged", ar: "بالبطاقة" },
        { en: "Helmet included", ar: "خوذة مشمولة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Helmet included", ar: "خوذة مشمولة" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
        { en: "All accessories", ar: "كل الملحقات" },
      ],
      worn: [
        { en: "Rust", ar: "صدأ" },
        { en: "Worn tires", ar: "إطارات مهترئة" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Needs tune-up", ar: "يحتاج ضبط" },
      ],
    },
    "Team Sports": {
      new: [
        { en: "Still tagged", ar: "بالبطاقة" },
        { en: "Full set", ar: "طقم كامل" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Full set", ar: "طقم كامل" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Worn grip", ar: "المقبض مهترئ" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Faded", ar: "باهت" },
      ],
    },
    Outdoor: {
      new: [
        { en: "Still tagged", ar: "بالبطاقة" },
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "All accessories", ar: "كل الملحقات" },
        { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Well maintained", ar: "معتنى به" },
      ],
      worn: [
        { en: "Rust", ar: "صدأ" },
        { en: "Tears", ar: "تمزّق" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
        { en: "Faded", ar: "باهت" },
      ],
    },
  },
  books: {
    _default: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "First edition", ar: "الطبعة الأولى" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Notes inside", ar: "ملاحظات بداخله" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "Torn pages", ar: "صفحات ممزقة" },
        { en: "Water damage", ar: "تلف بالماء" },
      ],
    },
    Textbooks: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Edition noted", ar: "الطبعة مذكورة" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Edition noted", ar: "الطبعة مذكورة" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
      ],
      worn: [
        { en: "Highlighted", ar: "فيه تظليل" },
        { en: "Notes inside", ar: "ملاحظات بداخله" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "Torn pages", ar: "صفحات ممزقة" },
        { en: "Water damage", ar: "تلف بالماء" },
      ],
    },
    Novels: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "First edition", ar: "الطبعة الأولى" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
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
        { en: "Torn cover", ar: "الغلاف ممزق" },
        { en: "Yellowed pages", ar: "صفحات مصفرّة" },
        { en: "Water damage", ar: "تلف بالماء" },
      ],
    },
    Religious: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "First edition", ar: "الطبعة الأولى" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
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
        { en: "Torn cover", ar: "الغلاف ممزق" },
        { en: "Worn cover", ar: "غلاف مهترئ" },
        { en: "Water damage", ar: "تلف بالماء" },
      ],
    },
    Children: {
      new: [
        { en: "Shrink-wrapped", ar: "مغلوف بالنايلون" },
        { en: "Illustrated", ar: "مصوّر" },
        { en: "Hardcover", ar: "غلاف مقوّى" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Illustrated", ar: "مصوّر" },
        { en: "Clean pages", ar: "صفحات نظيفة" },
        { en: "Complete set", ar: "مجموعة كاملة" },
      ],
      worn: [
        { en: "Torn pages", ar: "صفحات ممزقة" },
        { en: "Scribbles", ar: "شخبطات" },
        { en: "Loose binding", ar: "تجليد مرتخي" },
        { en: "Worn cover", ar: "غلاف مهترئ" },
        { en: "Missing pages", ar: "صفحات ناقصة" },
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
        { en: "Underweight", ar: "نحيف" },
        { en: "Injured", ar: "مصاب" },
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
        { en: "Underweight", ar: "نحيف" },
        { en: "Injured", ar: "مصاب" },
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
        { en: "Special diet", ar: "يحتاج حمية خاصة" },
        { en: "Injured", ar: "مصاب" },
        { en: "Unvaccinated", ar: "غير مطعّم" },
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
        { en: "Injured", ar: "مصاب" },
        { en: "Plucked feathers", ar: "ريش متساقط" },
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
        { en: "Sick", ar: "مريض" },
        { en: "Injured", ar: "مصاب" },
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
        { en: "Broken", ar: "مكسور" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
        { en: "Expired", ar: "منتهي الصلاحية" },
        { en: "Worn", ar: "مهترئ" },
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
        { en: "Flexible hours", ar: "ساعات مرنة" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "One-on-one", ar: "خصوصي" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
        { en: "Completion certificate", ar: "شهادة إتمام" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Certified", ar: "معتمد" },
        { en: "Materials included", ar: "شامل المواد" },
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
        { en: "Experienced", ar: "ذو خبرة" },
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
        { en: "Experienced", ar: "ذو خبرة" },
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
        { en: "Experienced", ar: "ذو خبرة" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Tasting available", ar: "تذوق متاح" },
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
        { en: "Experienced", ar: "ذو خبرة" },
        { en: "Setup included", ar: "تركيب مشمول" },
        { en: "Available on date", ar: "متاح بالتاريخ" },
        { en: "Customizable", ar: "حسب الطلب" },
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
        { en: "Cracks", ar: "شقوق" },
        { en: "Chips", ar: "تكسرات" },
        { en: "Tarnished", ar: "مطعّج" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
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
        { en: "Tarnished", ar: "مطعّج" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Worn details", ar: "التفاصيل باهتة" },
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
        { en: "Cracks", ar: "شقوق" },
        { en: "Chips", ar: "تكسرات" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
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
        { en: "Scratches", ar: "خدوش" },
        { en: "Chips", ar: "تكسرات" },
        { en: "Missing parts", ar: "أجزاء ناقصة" },
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
        { en: "Original", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Hand-carved", ar: "حفر يدوي" },
      ],
      worn: [
        { en: "Needs reframing", ar: "يحتاج تأطير" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Faded", ar: "باهت" },
        { en: "Tears", ar: "تمزّق" },
        { en: "Damaged", ar: "تالف" },
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
        { en: "Scratches", ar: "خدوش" },
        { en: "Faded", ar: "باهت" },
        { en: "Tears", ar: "تمزّق" },
        { en: "Water damage", ar: "تلف بالماء" },
      ],
    },
    Handicrafts: {
      new: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Signed", ar: "موقّع" },
        { en: "Limited edition", ar: "إصدار محدود" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
      ],
      used: [
        { en: "Handmade", ar: "صناعة يدوية" },
        { en: "Hand-carved", ar: "حفر يدوي" },
        { en: "Original", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
      ],
      worn: [
        { en: "Needs restoration", ar: "يحتاج ترميم" },
        { en: "Scratches", ar: "خدوش" },
        { en: "Chips", ar: "تكسرات" },
        { en: "Faded", ar: "باهت" },
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
        { en: "Scratches", ar: "خدوش" },
        { en: "Faded", ar: "باهت" },
        { en: "Damaged", ar: "تالف" },
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
        { en: "Fresh", ar: "طازج" },
        { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
        { en: "Family-made", ar: "منتج أسري" },
        { en: "Customizable", ar: "حسب الطلب" },
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
        { en: "Sealed", ar: "مختوم" },
        { en: "Gift-ready", ar: "جاهز للإهداء" },
        { en: "Authentic", ar: "أصلي" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      used: [
        { en: "Authentic", ar: "أصلي" },
        { en: "Minor wear", ar: "استخدام بسيط" },
        { en: "Working", ar: "شغّال" },
        { en: "Customizable", ar: "حسب الطلب" },
      ],
      worn: [
        { en: "Scratches", ar: "خدوش" },
        { en: "Broken parts", ar: "أجزاء مكسورة" },
        { en: "Faded", ar: "باهت" },
        { en: "Needs repair", ar: "يحتاج إصلاح" },
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