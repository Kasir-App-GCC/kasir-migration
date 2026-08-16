import {
  LayoutGrid, Home, Smartphone, Car, Armchair, Shirt, Building2,
  Briefcase, Wrench, Gamepad2, Dumbbell, Book,
} from "lucide-react";

export const CATEGORIES = [
  { id: "all", en: "All", ar: "الكل", icon: LayoutGrid, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  { id: "families", en: "Productive Families", ar: "الأسر المنتجة", icon: Home, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", featured: true },
  { id: "electronics", en: "Electronics", ar: "إلكترونيات", icon: Smartphone, color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { id: "cars", en: "Cars", ar: "سيارات", icon: Car, color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  { id: "furniture", en: "Furniture", ar: "أثاث", icon: Armchair, color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { id: "fashion", en: "Fashion", ar: "أزياء", icon: Shirt, color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
  { id: "realestate", en: "Real Estate", ar: "عقارات", icon: Building2, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  { id: "jobs", en: "Jobs", ar: "وظائف", icon: Briefcase, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  { id: "services", en: "Services", ar: "خدمات", icon: Wrench, color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  { id: "toys", en: "Toys", ar: "ألعاب", icon: Gamepad2, color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { id: "sports", en: "Sports", ar: "رياضة", icon: Dumbbell, color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  { id: "books", en: "Books", ar: "كتب", icon: Book, color: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200" },
];

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