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
    { en: "Food", ar: "أطعمة" },
    { en: "Bakery & Sweets", ar: "مخبوزات وحلويات" },
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
    { en: "Team Sports", ar: "رياضات جماعية" },
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
  { id: "like_new", en: "Like New", ar: "مستعمل ممتاز", color: "bg-blue-500 text-white" },
  { id: "used", en: "Used", ar: "مستعمل", color: "bg-amber-500 text-white" },
];

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id) || CONDITIONS[2];
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

export function getCityName(value, lang = "en") {
  if (!value) return lang === "ar" ? "كل المدن" : "All cities";
  const c = SAUDI_CITIES.find((x) => x.en === value || x.ar === value);
  return c ? (lang === "ar" ? c.ar : c.en) : value;
}

export const SAUDI_CITIES = [
  { en: "Riyadh", ar: "الرياض" },
  { en: "Jeddah", ar: "جدة" },
  { en: "Mecca", ar: "مكة المكرمة" },
  { en: "Medina", ar: "المدينة المنورة" },
  { en: "Dammam", ar: "الدمام" },
  { en: "Khobar", ar: "الخبر" },
  { en: "Tabuk", ar: "تبوك" },
  { en: "Abha", ar: "أبها" },
  { en: "Taif", ar: "الطائف" },
  { en: "Buraidah", ar: "بريدة" },
  { en: "Khamis Mushait", ar: "خميس مشيط" },
  { en: "Hail", ar: "حائل" },
  { en: "Hofuf", ar: "الهفوف" },
  { en: "Mubarraz", ar: "المبرز" },
  { en: "Najran", ar: "نجران" },
  { en: "Jizan", ar: "جازان" },
  { en: "Yanbu", ar: "ينبع" },
  { en: "Jubail", ar: "الجبيل" },
  { en: "Qatif", ar: "القطيف" },
  { en: "Arar", ar: "عرعر" },
  { en: "Sakaka", ar: "سكاكا" },
  { en: "Baha", ar: "الباحة" },
  { en: "Hafar Al-Batin", ar: "حفر الباطن" },
  { en: "Rabigh", ar: "رابغ" },
  { en: "Sabya", ar: "صبيا" },
  { en: "Wadi Al-Dawasir", ar: "وادي الدواسر" },
  { en: "Afif", ar: "عفيف" },
  { en: "Madinat Al-Sultan", ar: "مدينة سلطان" },
  { en: "Turaif", ar: "طريف" },
  { en: "Sharurah", ar: "شرورة" },
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