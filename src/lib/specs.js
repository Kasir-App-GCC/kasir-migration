// Structured per-category specification fields. Sellers fill these in on the
// listing form (only for categories that have them) and buyers see them in a
// "Specifications" block on the item page. Each field carries a bilingual
// label (shown above the input, not just as a placeholder) and an optional
// hint to help the seller know exactly what to enter.

export const SPEC_FIELDS = {
  cars: [
    { key: "year", type: "number", en: "Year", ar: "السنة", placeholder: "2020", hint: { en: "Model year of the car", ar: "موديل السنة" } },
    { key: "make", type: "text", en: "Make", ar: "الماركة", placeholder: "Toyota", hint: { en: "e.g. Toyota, Hyundai", ar: "مثال: تويوتا، هيونداي" } },
    { key: "mileage", type: "number", en: "Mileage (km)", ar: "الممشى (كم)", placeholder: "85000", hint: { en: "Total kilometers driven", ar: "إجمالي الكيلومترات المقطوعة" } },
    {
      key: "transmission", type: "select", en: "Transmission", ar: "ناقل الحركة",
      options: [
        { value: "automatic", en: "Automatic", ar: "أوتوماتيك" },
        { value: "manual", en: "Manual", ar: "عادي" },
      ],
    },
    {
      key: "fuel", type: "select", en: "Fuel", ar: "الوقود",
      options: [
        { value: "petrol", en: "Petrol", ar: "بنزين" },
        { value: "diesel", en: "Diesel", ar: "ديزل" },
        { value: "hybrid", en: "Hybrid", ar: "هايبرد" },
        { value: "electric", en: "Electric", ar: "كهرباء" },
      ],
    },
  ],
  realestate: [
    { key: "bedrooms", type: "number", en: "Bedrooms", ar: "غرف النوم", placeholder: "3", hint: { en: "Number of bedrooms", ar: "عدد غرف النوم" } },
    { key: "bathrooms", type: "number", en: "Bathrooms", ar: "دورات المياه", placeholder: "2", hint: { en: "Number of bathrooms", ar: "عدد دورات المياه" } },
    { key: "area", type: "number", en: "Area (m²)", ar: "المساحة (م²)", placeholder: "180", hint: { en: "Total area in square meters", ar: "المساحة الإجمالية بالمتر المربع" } },
    {
      key: "furnished", type: "select", en: "Furnished", ar: "مفروش",
      options: [
        { value: "yes", en: "Yes", ar: "نعم" },
        { value: "no", en: "No", ar: "لا" },
      ],
    },
  ],
  electronics: [
    { key: "brand", type: "text", en: "Brand", ar: "الماركة", placeholder: "Apple", hint: { en: "Manufacturer brand", ar: "الشركة المصنّعة" } },
    { key: "model", type: "text", en: "Model", ar: "الموديل", placeholder: "iPhone 13", hint: { en: "Exact model name/number", ar: "اسم/رقم الموديل بالضبط" } },
    { key: "storage", type: "text", en: "Storage", ar: "السعة", placeholder: "128GB", hint: { en: "Storage capacity, if applicable", ar: "سعة التخزين إن وُجدت" } },
  ],
  furniture: [
    { key: "material", type: "select", en: "Material", ar: "الخامة", options: [
      { value: "wood", en: "Wood", ar: "خشب" },
      { value: "metal", en: "Metal", ar: "معدن" },
      { value: "plastic", en: "Plastic", ar: "بلاستيك" },
      { value: "fabric", en: "Fabric", ar: "قماش" },
      { value: "leather", en: "Leather", ar: "جلد" },
      { value: "glass", en: "Glass", ar: "زجاج" },
    ] },
    { key: "color", type: "text", en: "Color", ar: "اللون", placeholder: "Beige" },
    { key: "dimensions", type: "text", en: "Dimensions (cm)", ar: "المقاسات (سم)", placeholder: "200×90×75", hint: { en: "Length × Width × Height", ar: "الطول × العرض × الارتفاع" } },
    { key: "age", type: "select", en: "Age", ar: "العمر", options: [
      { value: "new", en: "Brand new", ar: "جديد" },
      { value: "lt_1y", en: "Under 1 year", ar: "أقل من سنة" },
      { value: "1_3y", en: "1–3 years", ar: "1–3 سنوات" },
      { value: "3y_plus", en: "3+ years", ar: "أكثر من 3 سنوات" },
    ] },
  ],
  fashion: [
    { key: "size", type: "select", en: "Size", ar: "المقاس", options: [
      { value: "xs", en: "XS", ar: "XS" },
      { value: "s", en: "S", ar: "S" },
      { value: "m", en: "M", ar: "M" },
      { value: "l", en: "L", ar: "L" },
      { value: "xl", en: "XL", ar: "XL" },
      { value: "xxl", en: "XXL", ar: "XXL" },
      { value: "free", en: "Free size", ar: "مقاس حر" },
    ] },
    { key: "brand", type: "text", en: "Brand", ar: "الماركة", placeholder: "Zara" },
    { key: "color", type: "text", en: "Color", ar: "اللون", placeholder: "Black" },
    { key: "gender", type: "select", en: "Gender", ar: "الفئة", options: [
      { value: "men", en: "Men", ar: "رجالي" },
      { value: "women", en: "Women", ar: "نسائي" },
      { value: "kids", en: "Kids", ar: "أطفال" },
      { value: "unisex", en: "Unisex", ar: "للجنسين" },
    ] },
  ],
  sports: [
    { key: "type", type: "text", en: "Type", ar: "النوع", placeholder: "Treadmill", hint: { en: "What kind of equipment/item", ar: "نوع الجهاز/الغرض" } },
    { key: "brand", type: "text", en: "Brand", ar: "الماركة", placeholder: "Nike" },
    { key: "size", type: "text", en: "Size", ar: "المقاس", placeholder: "M / 42", hint: { en: "Size if applicable", ar: "المقاس إن وُجد" } },
  ],
  toys: [
    { key: "age_range", type: "select", en: "Age range", ar: "الفئة العمرية", options: [
      { value: "0_2", en: "0–2 years", ar: "0–2 سنة" },
      { value: "3_5", en: "3–5 years", ar: "3–5 سنوات" },
      { value: "6_8", en: "6–8 years", ar: "6–8 سنوات" },
      { value: "9_12", en: "9–12 years", ar: "9–12 سنة" },
      { value: "13_plus", en: "13+ years", ar: "13+ سنة" },
    ] },
    { key: "brand", type: "text", en: "Brand", ar: "الماركة", placeholder: "LEGO" },
  ],
  animals: [
    { key: "species", type: "text", en: "Species / Breed", ar: "النوع / السلالة", placeholder: "Persian cat", hint: { en: "Animal type or breed", ar: "نوع الحيوان أو سلالته" } },
    { key: "age", type: "text", en: "Age", ar: "العمر", placeholder: "2 years" },
    { key: "vaccinated", type: "select", en: "Vaccinated", ar: "مُطعّم", options: [
      { value: "yes", en: "Yes", ar: "نعم" },
      { value: "no", en: "No", ar: "لا" },
      { value: "unknown", en: "Unknown", ar: "غير معروف" },
    ] },
  ],
  services: [
    { key: "service_type", type: "text", en: "Service type", ar: "نوع الخدمة", placeholder: "Plumbing", hint: { en: "What service you offer", ar: "نوع الخدمة المقدّمة" } },
    { key: "experience", type: "text", en: "Experience", ar: "الخبرة", placeholder: "5 years" },
    { key: "available", type: "select", en: "Availability", ar: "التفرّغ", options: [
      { value: "full", en: "Full-time", ar: "دوام كامل" },
      { value: "part", en: "Part-time", ar: "جزئي" },
      { value: "flexible", en: "Flexible", ar: "مرن" },
    ] },
  ],
  jobs: [
    { key: "job_type", type: "select", en: "Job type", ar: "نوع الوظيفة", options: [
      { value: "full", en: "Full-time", ar: "دوام كامل" },
      { value: "part", en: "Part-time", ar: "جزئي" },
      { value: "contract", en: "Contract", ar: "عقد" },
      { value: "remote", en: "Remote", ar: "عن بُعد" },
    ] },
    { key: "salary", type: "text", en: "Salary", ar: "الراتب", placeholder: "3000 SAR", hint: { en: "Monthly salary or range", ar: "الراتب الشهري أو النطاق" } },
    { key: "experience", type: "text", en: "Experience", ar: "الخبرة", placeholder: "2 years" },
  ],
  books: [
    { key: "author", type: "text", en: "Author", ar: "المؤلف", placeholder: "—" },
    { key: "language", type: "text", en: "Language", ar: "اللغة", placeholder: "Arabic" },
    { key: "pages", type: "number", en: "Pages", ar: "الصفحات", placeholder: "320" },
  ],
  antiques: [
    { key: "era", type: "text", en: "Era", ar: "الحقبة", placeholder: "1960s", hint: { en: "Approximate age/period", ar: "العصر أو الحقبة التقريبية" } },
    { key: "origin", type: "text", en: "Origin", ar: "المنشأ", placeholder: "Saudi" },
  ],
  arts: [
    { key: "medium", type: "select", en: "Medium", ar: "الوسيط", options: [
      { value: "painting", en: "Painting", ar: "رسم" },
      { value: "sculpture", en: "Sculpture", ar: "نحت" },
      { value: "digital", en: "Digital", ar: "رقمي" },
      { value: "photography", en: "Photography", ar: "تصوير" },
      { value: "handcraft", en: "Handcraft", ar: "حرف يدوية" },
    ] },
    { key: "dimensions", type: "text", en: "Dimensions", ar: "المقاسات", placeholder: "50×70 cm" },
  ],
  occasions: [
    { key: "occasion_type", type: "text", en: "Occasion", ar: "المناسبة", placeholder: "Wedding", hint: { en: "Type of event", ar: "نوع المناسبة" } },
    { key: "quantity", type: "number", en: "Quantity", ar: "الكمية", placeholder: "50" },
  ],
  education: [
    { key: "field", type: "text", en: "Field", ar: "المجال", placeholder: "Programming", hint: { en: "Subject/skill taught", ar: "المادة أو المهربة المُعلّمة" } },
    { key: "format", type: "select", en: "Format", ar: "الطريقة", options: [
      { value: "in_person", en: "In-person", ar: "حضوري" },
      { value: "online", en: "Online", ar: "أونلاين" },
      { value: "hybrid", en: "Hybrid", ar: "مدمج" },
    ] },
    { key: "duration", type: "text", en: "Duration", ar: "المدة", placeholder: "3 months" },
  ],
};

export function getSpecFields(category) {
  return SPEC_FIELDS[category] || [];
}

export function formatSpecValue(field, value, lang) {
  if (value == null || value === "") return "";
  if (field.type === "select") {
    const opt = (field.options || []).find((o) => o.value === value);
    return opt ? (lang === "ar" ? opt.ar : opt.en) : String(value);
  }
  return String(value);
}

// Returns the filled specs as an ordered array of { label, value } for display.
export function specsForDisplay(category, specs, lang) {
  if (!specs || typeof specs !== "object") return [];
  const fields = getSpecFields(category);
  return fields
    .map((f) => {
      const raw = specs[f.key];
      const val = formatSpecValue(f, raw, lang);
      return val ? { key: f.key, label: lang === "ar" ? f.ar : f.en, value: val } : null;
    })
    .filter(Boolean);
}