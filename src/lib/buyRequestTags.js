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

// Subcategory-specific tags, keyed by `${category}|${subcategoryEn}`.
// When a subcategory is selected, these take precedence over category tags.
export const BUY_REQUEST_SUBCATEGORY_TAGS = {
  // Electronics
  "electronics|Phones": [
    { en: "Unlocked", ar: "مفتوح لكل الشبكات" },
    { en: "Charger included", ar: "مع الشاحن" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Sealed", ar: "مختوم" },
    { en: "Battery > 90%", ar: "بطارية فوق ٩٠٪" },
  ],
  "electronics|Laptops": [
    { en: "Original charger", ar: "الشاحن الأصلي" },
    { en: "SSD", ar: "قرص SSD" },
    { en: "RAM upgradeable", ar: "ذاكرة قابلة للترقية" },
    { en: "With bag", ar: "مع حقيبة" },
  ],
  "electronics|Tablets": [
    { en: "Charger included", ar: "مع الشاحن" },
    { en: "With stylus", ar: "مع القلم" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Screen protector", ar: "حماية شاشة" },
  ],
  "electronics|TVs & Screens": [
    { en: "With stand", ar: "مع القاعدة" },
    { en: "Wall mountable", ar: "قابل للتعليق" },
    { en: "4K", ar: "4K" },
    { en: "Remote included", ar: "مع الريموت" },
  ],
  "electronics|Audio": [
    { en: "Original case", ar: "بالعلبة الأصلية" },
    { en: "All tips", ar: "كل السدادات" },
    { en: "Charger included", ar: "مع الشاحن" },
    { en: "Noise cancelling", ar: "عزل ضوضاء" },
  ],
  "electronics|Gaming": [
    { en: "All controllers", ar: "كل أذرع التحكم" },
    { en: "With games", ar: "مع الألعاب" },
    { en: "Sealed", ar: "مختوم" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
  ],
  "electronics|Accessories": [
    { en: "Original", ar: "أصلي" },
    { en: "Sealed", ar: "مختوم" },
    { en: "Compatible", ar: "متوافق" },
  ],
  // Cars
  "cars|Sedan": [
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "Full service history", ar: "سجل صيانة كامل" },
  ],
  "cars|SUV / 4x4": [
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "4x4", ar: "دفع رباعي" },
    { en: "No accidents", ar: "بلا حوادث" },
    { en: "Full service history", ar: "سجل صيانة كامل" },
  ],
  "cars|Motorcycles": [
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "Low mileage", ar: "ممشور قليل" },
    { en: "Helmet included", ar: "مع خوذة" },
    { en: "No accidents", ar: "بلا حوادث" },
  ],
  "cars|Parts & Accessories": [
    { en: "Original", ar: "أصلي" },
    { en: "GCC specs", ar: "مواصفات خليجية" },
    { en: "Used ok", ar: "مستعمل مقبول" },
  ],
  // Furniture
  "furniture|Sofas": [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "Washable covers", ar: "أغطية قابلة للغسل" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  "furniture|Beds": [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Mattress included", ar: "مع المرتبة" },
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  "furniture|Tables & Chairs": [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "All chairs", ar: "كل الكراسي" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  "furniture|Storage": [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Disassembly available", ar: "تفكيك متاح" },
    { en: "All shelves", ar: "كل الرفوف" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  "furniture|Decor": [
    { en: "Smoke-free", ar: "بيت بلا تدخين" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Original", ar: "أصلي" },
  ],
  // Fashion
  "fashion|Men": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
    { en: "From clean closet", ar: "من خزانة نظيفة" },
  ],
  "fashion|Women": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
    { en: "From clean closet", ar: "من خزانة نظيفة" },
  ],
  "fashion|Kids": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
    { en: "From clean closet", ar: "من خزانة نظيفة" },
  ],
  "fashion|Shoes": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
  ],
  "fashion|Bags": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Dust bag included", ar: "مع كيس الغبار" },
    { en: "Unworn", ar: "غير ملبوس" },
  ],
  "fashion|Accessories": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Original box", ar: "بالعلبة الأصلية" },
    { en: "Original tags", ar: "بالعلامة الأصلية" },
    { en: "Unworn", ar: "غير ملبوس" },
  ],
  // Real Estate
  "realestate|For Sale": [
    { en: "Furnished", ar: "مفروش" },
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  "realestate|For Rent": [
    { en: "Furnished", ar: "مفروش" },
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  "realestate|Apartments": [
    { en: "Furnished", ar: "مفروش" },
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  "realestate|Villas": [
    { en: "Furnished", ar: "مفروش" },
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  "realestate|Land": [
    { en: "Direct owner", ar: "من المالك مباشرة" },
    { en: "No commission", ar: "بدون عمولة" },
    { en: "Titled", ar: "صك إفراغ" },
    { en: "Available now", ar: "متاح الآن" },
  ],
  // Services
  "services|Cleaning": [
    { en: "Licensed", ar: "مرخّص" },
    { en: "Same-day", ar: "بنفس اليوم" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "Materials included", ar: "شامل المواد" },
  ],
  "services|Maintenance": [
    { en: "Licensed", ar: "مرخّص" },
    { en: "Same-day", ar: "بنفس اليوم" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
    { en: "Warranty", ar: "ضمان" },
  ],
  "services|Tutoring": [
    { en: "Certified", ar: "معتمد" },
    { en: "One-on-one", ar: "خصوصي" },
    { en: "Free trial", ar: "تجربة مجانية" },
    { en: "Beginner friendly", ar: "للمبتدئين" },
  ],
  "services|Transport": [
    { en: "Licensed", ar: "مرخّص" },
    { en: "Same-day", ar: "بنفس اليوم" },
    { en: "Insured", ar: "مؤمّن" },
    { en: "Mobile service", ar: "خدمة متنقلة" },
  ],
  "services|Events": [
    { en: "Licensed", ar: "مرخّص" },
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Setup included", ar: "تركيب مشمول" },
  ],
  // Toys
  "toys|Kids Toys": [
    { en: "All pieces", ar: "كل القطع" },
    { en: "Original packaging", ar: "بالتغليف الأصلي" },
    { en: "Complete set", ar: "طقم كامل" },
    { en: "Age-appropriate", ar: "مناسب للعمر" },
  ],
  "toys|Board Games": [
    { en: "All pieces", ar: "كل القطع" },
    { en: "Complete set", ar: "طقم كامل" },
    { en: "Original packaging", ar: "بالتغليف الأصلي" },
    { en: "Manual included", ar: "مع الدليل" },
  ],
  "toys|Collectibles": [
    { en: "Original packaging", ar: "بالتغليف الأصلي" },
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
  ],
  // Sports
  "sports|Fitness": [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
    { en: "Manual included", ar: "مع الدليل" },
  ],
  "sports|Bicycles": [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Helmet included", ar: "مع خوذة" },
    { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
  ],
  "sports|Team Sports": [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Complete set", ar: "طقم كامل" },
  ],
  "sports|Outdoor": [
    { en: "All accessories", ar: "كل الملحقات" },
    { en: "Well maintained", ar: "معتنى به" },
    { en: "Carry bag included", ar: "حقيبة حمل مشمولة" },
  ],
  // Books
  "books|Textbooks": [
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Clean pages", ar: "صفحات نظيفة" },
    { en: "Hardcover", ar: "غلاف مقوّى" },
    { en: "Complete set", ar: "مجموعة كاملة" },
  ],
  "books|Novels": [
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Clean pages", ar: "صفحات نظيفة" },
    { en: "Hardcover", ar: "غلاف مقوّى" },
    { en: "First edition", ar: "طبعة أولى" },
  ],
  "books|Religious": [
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Clean pages", ar: "صفحات نظيفة" },
    { en: "Hardcover", ar: "غلاف مقوّى" },
    { en: "Complete set", ar: "مجموعة كاملة" },
  ],
  "books|Children": [
    { en: "No highlights", ar: "بلا تظليل" },
    { en: "Clean pages", ar: "صفحات نظيفة" },
    { en: "All pages", ar: "كل الصفحات" },
    { en: "Complete set", ar: "مجموعة كاملة" },
  ],
  // Animals
  "animals|Livestock": [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Healthy", ar: "سليم" },
    { en: "With supplies", ar: "مع المستلزمات" },
    { en: "Tagged", ar: "موسوم" },
  ],
  "animals|Pets": [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Trained", ar: "مدرّب" },
    { en: "Healthy", ar: "سليم" },
    { en: "With supplies", ar: "مع المستلزمات" },
  ],
  "animals|Birds": [
    { en: "Vaccinated", ar: "مطعّم" },
    { en: "Healthy", ar: "سليم" },
    { en: "With cage", ar: "مع القفص" },
    { en: "With supplies", ar: "مع المستلزمات" },
  ],
  "animals|Fish": [
    { en: "Healthy", ar: "سليم" },
    { en: "With tank", ar: "مع الحوض" },
    { en: "With supplies", ar: "مع المستلزمات" },
    { en: "With filter", ar: "مع الفلتر" },
  ],
  "animals|Supplies": [
    { en: "Original", ar: "أصلي" },
    { en: "Complete set", ar: "طقم كامل" },
    { en: "Well maintained", ar: "معتنى به" },
  ],
  // Jobs
  "jobs|Full-time": [
    { en: "Remote ok", ar: "عن بُعد" },
    { en: "Visa provided", ar: "إقامة مشمولة" },
    { en: "Immediate start", ar: "بدء فوري" },
    { en: "Flexible hours", ar: "ساعات مرنة" },
  ],
  "jobs|Part-time": [
    { en: "Remote ok", ar: "عن بُعد" },
    { en: "Immediate start", ar: "بدء فوري" },
    { en: "Flexible hours", ar: "ساعات مرنة" },
    { en: "Visa provided", ar: "إقامة مشمولة" },
  ],
  "jobs|Freelance": [
    { en: "Remote ok", ar: "عن بُعد" },
    { en: "Immediate start", ar: "بدء فوري" },
    { en: "Flexible hours", ar: "ساعات مرنة" },
    { en: "Contract provided", ar: "مع عقد" },
  ],
  // Education
  "education|Tutoring": [
    { en: "Certified", ar: "معتمد" },
    { en: "Free trial", ar: "تجربة مجانية" },
    { en: "One-on-one", ar: "خصوصي" },
    { en: "Beginner friendly", ar: "للمبتدئين" },
  ],
  "education|Courses": [
    { en: "Certified", ar: "معتمد" },
    { en: "Free trial", ar: "تجربة مجانية" },
    { en: "Certificate provided", ar: "شهادة مشمولة" },
    { en: "Beginner friendly", ar: "للمبتدئين" },
  ],
  "education|Training": [
    { en: "Certified", ar: "معتمد" },
    { en: "One-on-one", ar: "خصوصي" },
    { en: "Certificate provided", ar: "شهادة مشمولة" },
    { en: "Beginner friendly", ar: "للمبتدئين" },
  ],
  // Occasions
  "occasions|Weddings": [
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Setup included", ar: "تركيب مشمول" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
  ],
  "occasions|Parties": [
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Setup included", ar: "تركيب مشمول" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
  ],
  "occasions|Catering": [
    { en: "All-inclusive", ar: "شامل الكل" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
  ],
  "occasions|Rentals": [
    { en: "Setup included", ar: "تركيب مشمول" },
    { en: "Delivery", ar: "توصيل" },
    { en: "Pickup", ar: "استلام" },
    { en: "Available on date", ar: "متاح بالتاريخ" },
  ],
  // Antiques
  "antiques|Coins": [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
    { en: "Appraised", ar: "مقيّم" },
  ],
  "antiques|Heritage": [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
    { en: "Appraised", ar: "مقيّم" },
  ],
  "antiques|Collectibles": [
    { en: "Authentic", ar: "أصلي" },
    { en: "With certificate", ar: "مع شهادة" },
    { en: "Rare", ar: "نادر" },
    { en: "Original packaging", ar: "بالتغليف الأصلي" },
  ],
  // Arts
  "arts|Paintings": [
    { en: "Signed", ar: "موقّع" },
    { en: "Framed", ar: "مؤطر" },
    { en: "Limited edition", ar: "إصدار محدود" },
    { en: "Handmade", ar: "صناعة يدوية" },
  ],
  "arts|Handicrafts": [
    { en: "Handmade", ar: "صناعة يدوية" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Signed", ar: "موقّع" },
    { en: "Original", ar: "أصلي" },
  ],
  "arts|Calligraphy": [
    { en: "Signed", ar: "موقّع" },
    { en: "Framed", ar: "مؤطر" },
    { en: "Handmade", ar: "صناعة يدوية" },
    { en: "Original", ar: "أصلي" },
  ],
  // Families
  "families|Food": [
    { en: "Fresh", ar: "طازج" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
  ],
  "families|Bakery & Sweets": [
    { en: "Fresh", ar: "طازج" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Same-day prep", ar: "تحضير بنفس اليوم" },
  ],
  "families|Handicrafts": [
    { en: "Handmade", ar: "صناعة يدوية" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Original", ar: "أصلي" },
  ],
  "families|Perfumes & Oud": [
    { en: "Authentic", ar: "أصلي" },
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "With bottle", ar: "مع الزجاجة" },
  ],
  "families|Clothing": [
    { en: "Family-made", ar: "منتج أسري" },
    { en: "Customizable", ar: "حسب الطلب" },
    { en: "Original", ar: "أصلي" },
    { en: "Unworn", ar: "غير ملبوس" },
  ],
};

export function getBuyRequestTagsForCategory(category, subcategory) {
  if (subcategory && BUY_REQUEST_SUBCATEGORY_TAGS[`${category}|${subcategory}`]) {
    return BUY_REQUEST_SUBCATEGORY_TAGS[`${category}|${subcategory}`];
  }
  return BUY_REQUEST_CATEGORY_TAGS[category] || [];
}

export function localizeBuyRequestTag(value, lang) {
  const tag = BUY_REQUEST_TAGS.find((t) => t.en === value);
  if (tag) return lang === "ar" ? tag.ar : tag.en;
  for (const cat of Object.keys(BUY_REQUEST_CATEGORY_TAGS)) {
    const found = BUY_REQUEST_CATEGORY_TAGS[cat].find((t) => t.en === value);
    if (found) return lang === "ar" ? found.ar : found.en;
  }
  for (const key of Object.keys(BUY_REQUEST_SUBCATEGORY_TAGS)) {
    const found = BUY_REQUEST_SUBCATEGORY_TAGS[key].find((t) => t.en === value);
    if (found) return lang === "ar" ? found.ar : found.en;
  }
  return value;
}