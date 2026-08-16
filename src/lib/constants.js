import {
  LayoutGrid, Home, Smartphone, Car, Armchair, Shirt, Building2,
  Wrench, Gamepad2, Dumbbell, Book, Package,
} from "lucide-react";

export const CATEGORIES = [
  { id: "all", en: "All", ar: "الكل", icon: LayoutGrid, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  { id: "families", en: "Productive Families", ar: "الأسر المنتجة", icon: Home, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", featured: true },
  { id: "electronics", en: "Electronics", ar: "إلكترونيات", icon: Smartphone, color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { id: "cars", en: "Cars", ar: "سيارات", icon: Car, color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  { id: "furniture", en: "Furniture", ar: "أثاث", icon: Armchair, color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { id: "fashion", en: "Fashion", ar: "أزياء", icon: Shirt, color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
  { id: "realestate", en: "Real Estate", ar: "عقارات", icon: Building2, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  { id: "services", en: "Services", ar: "خدمات", icon: Wrench, color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  { id: "toys", en: "Toys", ar: "ألعاب", icon: Gamepad2, color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { id: "sports", en: "Sports", ar: "رياضة", icon: Dumbbell, color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  { id: "books", en: "Books", ar: "كتب", icon: Book, color: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200" },
  { id: "other", en: "Other", ar: "أخرى", icon: Package, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
];

export const SUBCATEGORIES = {
  families: [
    { en: "Food", ar: "أكلات" },
    { en: "Bakery & Sweets", ar: "معجنات وحلويات" },
    { en: "Handicrafts", ar: "حرف يدوية" },
    { en: "Perfumes & Oud", ar: "عطور وعود" },
    { en: "Clothing", ar: "ملابس" },
    { en: "Other", ar: "أخرى" },
  ],
  electronics: [
    { en: "Phones", ar: "جوالات" },
    { en: "Laptops", ar: "لابتوبات" },
    { en: "Tablets", ar: "أجهزة لوحية" },
    { en: "TVs & Screens", ar: "شاشات" },
    { en: "Audio", ar: "صوتيات" },
    { en: "Gaming", ar: "ألعاب فيديو" },
    { en: "Accessories", ar: "ملحقات" },
    { en: "Other", ar: "أخرى" },
  ],
  cars: [
    { en: "Cars", ar: "سيارات" },
    { en: "SUVs & 4x4", ar: "دفع رباعي" },
    { en: "Motorcycles", ar: "دراجات نارية" },
    { en: "Parts & Accessories", ar: "قطع غيار" },
    { en: "Other", ar: "أخرى" },
  ],
  furniture: [
    { en: "Sofas", ar: "أرائك" },
    { en: "Beds", ar: "أسرة" },
    { en: "Tables & Chairs", ar: "طاولات وكراسي" },
    { en: "Storage", ar: "تخزين" },
    { en: "Decor", ar: "ديكور" },
    { en: "Other", ar: "أخرى" },
  ],
  fashion: [
    { en: "Men", ar: "رجالي" },
    { en: "Women", ar: "نسائي" },
    { en: "Kids", ar: "أطفال" },
    { en: "Shoes", ar: "أحذية" },
    { en: "Bags", ar: "حقائب" },
    { en: "Accessories", ar: "إكسسوارات" },
    { en: "Other", ar: "أخرى" },
  ],
  realestate: [
    { en: "For Sale", ar: "للبيع" },
    { en: "For Rent", ar: "للإيجار" },
    { en: "Apartments", ar: "شقق" },
    { en: "Villas", ar: "فلل" },
    { en: "Land", ar: "أراضي" },
    { en: "Other", ar: "أخرى" },
  ],
  services: [
    { en: "Cleaning", ar: "تنظيف" },
    { en: "Maintenance", ar: "صيانة" },
    { en: "Tutoring", ar: "دروس" },
    { en: "Transport", ar: "نقل" },
    { en: "Events", ar: "مناسبات" },
    { en: "Other", ar: "أخرى" },
  ],
  toys: [
    { en: "Kids Toys", ar: "ألعاب أطفال" },
    { en: "Board Games", ar: "ألعاب لوحية" },
    { en: "Collectibles", ar: "مقتنيات" },
    { en: "Other", ar: "أخرى" },
  ],
  sports: [
    { en: "Fitness", ar: "لياقة" },
    { en: "Bicycles", ar: "دراجات" },
    { en: "Team Sports", ar: "رياضات الفرق" },
    { en: "Outdoor", ar: "خارجي" },
    { en: "Other", ar: "أخرى" },
  ],
  books: [
    { en: "Textbooks", ar: "كتب مدرسية" },
    { en: "Novels", ar: "روايات" },
    { en: "Religious", ar: "كتب دينية" },
    { en: "Children", ar: "أطفال" },
    { en: "Other", ar: "أخرى" },
  ],
  other: [{ en: "Other", ar: "أخرى" }],
};

export function getSubcategories(catId) {
  return SUBCATEGORIES[catId] || [];
}

export const CONDITIONS = [
  { id: "new", en: "New", ar: "جديد", color: "bg-emerald-500 text-white" },
  { id: "like_new", en: "Like New", ar: "كالجديد", color: "bg-teal-500 text-white" },
  { id: "good", en: "Good", ar: "جيد", color: "bg-blue-500 text-white" },
  { id: "fair", en: "Fair", ar: "مقبول", color: "bg-amber-500 text-white" },
  { id: "used", en: "Used", ar: "مستعمل", color: "bg-orange-500 text-white" },
];

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id) || CONDITIONS[4];
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

export function getCityName(value, lang = "en") {
  if (!value) return lang === "ar" ? "كل المدن" : "All cities";
  const c = SAUDI_CITIES.find((x) => x.en === value || x.ar === value);
  return c ? (lang === "ar" ? c.ar : c.en) : value;
}

export function nearestCity(lat, lng) {
  let best = null;
  let min = Infinity;
  for (const c of SAUDI_CITIES) {
    if (!c.lat || !c.lng) continue;
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < min) {
      min = d;
      best = c;
    }
  }
  return best;
}

export const SAUDI_CITIES = [
  { en: "Riyadh", ar: "الرياض", lat: 24.7136, lng: 46.6753 },
  { en: "Jeddah", ar: "جدة", lat: 21.4856, lng: 39.1925 },
  { en: "Mecca", ar: "مكة المكرمة", lat: 21.3891, lng: 39.8579 },
  { en: "Medina", ar: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
  { en: "Dammam", ar: "الدمام", lat: 26.4207, lng: 50.0888 },
  { en: "Khobar", ar: "الخبر", lat: 26.2744, lng: 50.2113 },
  { en: "Tabuk", ar: "تبوك", lat: 28.3838, lng: 36.5662 },
  { en: "Abha", ar: "أبها", lat: 18.2203, lng: 42.5053 },
  { en: "Taif", ar: "الطائف", lat: 21.2854, lng: 40.4185 },
  { en: "Buraidah", ar: "بريدة", lat: 26.326, lng: 43.965 },
  { en: "Khamis Mushait", ar: "خميس مشيط", lat: 18.3, lng: 42.8 },
  { en: "Hail", ar: "حائل", lat: 27.5114, lng: 41.4208 },
  { en: "Hofuf", ar: "الهفوف", lat: 25.3833, lng: 49.5842 },
  { en: "Mubarraz", ar: "المبرز", lat: 25.4044, lng: 49.6464 },
  { en: "Najran", ar: "نجران", lat: 17.492, lng: 44.1328 },
  { en: "Jizan", ar: "جازان", lat: 16.8892, lng: 42.5511 },
  { en: "Yanbu", ar: "ينبع", lat: 24.089, lng: 38.0618 },
  { en: "Jubail", ar: "الجبيل", lat: 27.0046, lng: 49.6606 },
  { en: "Qatif", ar: "القطيف", lat: 26.5254, lng: 50.0111 },
  { en: "Arar", ar: "عرعر", lat: 30.9753, lng: 41.0389 },
  { en: "Sakaka", ar: "سكاكا", lat: 29.9697, lng: 40.2064 },
  { en: "Baha", ar: "الباحة", lat: 20.0129, lng: 41.4677 },
  { en: "Hafar Al-Batin", ar: "حفر الباطن", lat: 28.4994, lng: 46.1156 },
  { en: "Rabigh", ar: "رابغ", lat: 22.8044, lng: 39.0322 },
  { en: "Sabya", ar: "صبيا", lat: 17.15, lng: 42.6167 },
  { en: "Wadi Al-Dawasir", ar: "وادي الدواسر", lat: 20.4833, lng: 44.7167 },
  { en: "Afif", ar: "عفيف", lat: 23.9097, lng: 42.9167 },
  { en: "Madinat Al-Sultan", ar: "مدينة سلطان", lat: 24.0, lng: 46.0 },
  { en: "Turaif", ar: "طريف", lat: 31.675, lng: 38.6689 },
  { en: "Sharurah", ar: "شرورة", lat: 17.45, lng: 47.11 },
];

export const REPORT_REASONS = [
  { id: "not_available", en: "Listed as available but wasn't available", ar: "معلن كمتاح بس ما كان متوفر" },
  { id: "false_price", en: "False / misleading price tag", ar: "السعر المعروض غير صحيح" },
  { id: "counterfeit", en: "Counterfeit or fake item", ar: "منتج مقلد أو مزيف" },
  { id: "not_as_described", en: "Item not as described", ar: "غير مطابق للوصف" },
  { id: "prohibited", en: "Prohibited / banned item", ar: "منتج ممنوع" },
  { id: "scam", en: "Scam or fraud attempt", ar: "محاولة نصب أو احتيال" },
  { id: "inappropriate", en: "Inappropriate content", ar: "محتوى غير لائق" },
  { id: "harassment", en: "Harassment / abusive seller", ar: "مضايقة أو تعامل سيئ" },
  { id: "spam", en: "Spam / duplicate listing", ar: "إعلان مزعج أو مكرر" },
  { id: "other", en: "Other", ar: "سبب آخر" },
];