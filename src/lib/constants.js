import {
  LayoutGrid, Home, Smartphone, Car, Armchair, Shirt, Building2,
  Wrench, Gamepad2, Dumbbell, Book, Package, Cat, Briefcase,
  GraduationCap, PartyPopper, Gem, Palette,
} from "lucide-react";
import { SAUDI_CITIES, getCityName, nearestCity } from "./countries";
export { SAUDI_CITIES, getCityName, nearestCity };

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
  { id: "animals", en: "Animals", ar: "حيوانات", icon: Cat, color: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300" },
  { id: "jobs", en: "Jobs", ar: "وظائف", icon: Briefcase, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  { id: "education", en: "Education & Training", ar: "تدريب وتعليم", icon: GraduationCap, color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300" },
  { id: "occasions", en: "Occasions", ar: "مناسبات", icon: PartyPopper, color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  { id: "antiques", en: "Antiques & Rarities", ar: "نوادر وتراثيات", icon: Gem, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  { id: "arts", en: "Arts & Crafts", ar: "فنون وحرف", icon: Palette, color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  { id: "other", en: "Other", ar: "أخرى", icon: Package, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
];

export const SUBCATEGORIES = {
  families: [
    { en: "Food", ar: "أكلات" },
    { en: "Bakery & Sweets", ar: "معجنات وحلويات" },
    { en: "Handicrafts", ar: "حرف يدوية" },
    { en: "Perfumes & Oud", ar: "عطور وعود" },
    { en: "Clothing", ar: "ملابس" },
    { en: "Natural Products", ar: "منتجات طبيعية" },
    { en: "Other", ar: "أخرى" },
  ],
  electronics: [
    { en: "Phones", ar: "جوالات" },
    { en: "Laptops", ar: "لابتوبات" },
    { en: "Tablets", ar: "أجهزة لوحية" },
    { en: "TVs & Screens", ar: "شاشات" },
    { en: "Audio", ar: "صوتيات" },
    { en: "Gaming", ar: "ألعاب فيديو" },
    { en: "Cameras & Photography", ar: "كاميرات وتصوير" },
    { en: "Smart Watches & Wearables", ar: "ساعات ذكية" },
    { en: "Computer Components", ar: "قطع كمبيوتر" },
    { en: "Accessories", ar: "ملحقات" },
    { en: "Other", ar: "أخرى" },
  ],
  cars: [
    { en: "Sedan", ar: "سيدان" },
    { en: "SUV / 4x4", ar: "دفع رباعي" },
    { en: "Hatchback", ar: "هاتشباك" },
    { en: "Coupe", ar: "كوبيه" },
    { en: "Sports Car", ar: "سيارة رياضية" },
    { en: "Convertible", ar: "كشف" },
    { en: "Pickup Truck", ar: "بيك أب" },
    { en: "Vans & Minivans", ar: "فانات" },
    { en: "Motorcycles", ar: "دراجات نارية" },
    { en: "Boats & Watercraft", ar: "قوارب" },
    { en: "Parts & Accessories", ar: "قطع غيار" },
    { en: "Other", ar: "أخرى" },
  ],
  furniture: [
    { en: "Sofas", ar: "أرائك" },
    { en: "Beds", ar: "أسرة" },
    { en: "Tables & Chairs", ar: "طاولات وكراسي" },
    { en: "Storage", ar: "تخزين" },
    { en: "Decor", ar: "ديكور" },
    { en: "Office Furniture", ar: "أثاث مكتبي" },
    { en: "Outdoor Furniture", ar: "أثاث خارجي" },
    { en: "Kids Furniture", ar: "أثاث أطفال" },
    { en: "Other", ar: "أخرى" },
  ],
  fashion: [
    { en: "Men", ar: "رجالي" },
    { en: "Women", ar: "نسائي" },
    { en: "Kids", ar: "أطفال" },
    { en: "Shoes", ar: "أحذية" },
    { en: "Bags", ar: "حقائب" },
    { en: "Watches", ar: "ساعات" },
    { en: "Jewelry", ar: "مجوهرات" },
    { en: "Accessories", ar: "إكسسوارات" },
    { en: "Traditional Wear", ar: "ملابس تراثية" },
    { en: "Other", ar: "أخرى" },
  ],
  realestate: [
    { en: "For Sale", ar: "للبيع" },
    { en: "For Rent", ar: "للإيجار" },
    { en: "Apartments", ar: "شقق" },
    { en: "Villas", ar: "فلل" },
    { en: "Land", ar: "أراضي" },
    { en: "Commercial", ar: "تجاري" },
    { en: "Shared Room", ar: "غرفة مشتركة" },
    { en: "Other", ar: "أخرى" },
  ],
  services: [
    { en: "Cleaning", ar: "تنظيف" },
    { en: "Maintenance", ar: "صيانة" },
    { en: "Tutoring", ar: "دروس" },
    { en: "Transport", ar: "نقل" },
    { en: "Events", ar: "مناسبات" },
    { en: "Beauty & Grooming", ar: "تجميل وعناية" },
    { en: "Health & Wellness", ar: "صحة ولياقة" },
    { en: "IT & Tech Support", ar: "دعم تقني" },
    { en: "Other", ar: "أخرى" },
  ],
  toys: [
    { en: "Kids Toys", ar: "ألعاب أطفال" },
    { en: "Board Games", ar: "ألعاب لوحية" },
    { en: "Collectibles", ar: "مقتنيات" },
    { en: "Video Games", ar: "ألعاب فيديو" },
    { en: "Outdoor Toys", ar: "ألعاب خارجية" },
    { en: "Educational Toys", ar: "ألعاب تعليمية" },
    { en: "Other", ar: "أخرى" },
  ],
  sports: [
    { en: "Fitness", ar: "لياقة" },
    { en: "Bicycles", ar: "دراجات" },
    { en: "Team Sports", ar: "رياضات الفرق" },
    { en: "Outdoor", ar: "خارجي" },
    { en: "Water Sports", ar: "رياضات مائية" },
    { en: "Martial Arts", ar: "فنون قتالية" },
    { en: "Other", ar: "أخرى" },
  ],
  books: [
    { en: "Textbooks", ar: "كتب مدرسية" },
    { en: "Novels", ar: "روايات" },
    { en: "Religious", ar: "كتب دينية" },
    { en: "Children", ar: "أطفال" },
    { en: "Magazines", ar: "مجلات" },
    { en: "Comics", ar: "قصص مصورة" },
    { en: "Other", ar: "أخرى" },
  ],
  animals: [
    { en: "Livestock", ar: "مواشي" },
    { en: "Pets", ar: "حيوانات أليفة" },
    { en: "Birds", ar: "طيور" },
    { en: "Fish", ar: "أسماك" },
    { en: "Reptiles", ar: "زواحف" },
    { en: "Supplies", ar: "مستلزمات" },
    { en: "Other", ar: "أخرى" },
  ],
  jobs: [
    { en: "Full-time", ar: "دوام كامل" },
    { en: "Part-time", ar: "دوام جزئي" },
    { en: "Freelance", ar: "حر" },
    { en: "Internship", ar: "تدريب" },
    { en: "Remote", ar: "عن بُعد" },
    { en: "Other", ar: "أخرى" },
  ],
  education: [
    { en: "Tutoring", ar: "دروس خصوصية" },
    { en: "Courses", ar: "دورات" },
    { en: "Training", ar: "تدريب" },
    { en: "Languages", ar: "لغات" },
    { en: "Online Classes", ar: "دروس أونلاين" },
    { en: "Other", ar: "أخرى" },
  ],
  occasions: [
    { en: "Weddings", ar: "أعراس" },
    { en: "Parties", ar: "حفلات" },
    { en: "Catering", ar: "تقديم طعام" },
    { en: "Rentals", ar: "تأجير" },
    { en: "Decorations", ar: "ديكورات" },
    { en: "Photography", ar: "تصوير" },
    { en: "Other", ar: "أخرى" },
  ],
  antiques: [
    { en: "Coins", ar: "عملات" },
    { en: "Heritage", ar: "تراثيات" },
    { en: "Collectibles", ar: "مقتنيات" },
    { en: "Antique Furniture", ar: "أثاث تراثي" },
    { en: "Other", ar: "أخرى" },
  ],
  arts: [
    { en: "Paintings", ar: "لوحات" },
    { en: "Handicrafts", ar: "حرف يدوية" },
    { en: "Calligraphy", ar: "خط عربي" },
    { en: "Sculptures", ar: "منحوتات" },
    { en: "Digital Art", ar: "فن رقمي" },
    { en: "Other", ar: "أخرى" },
  ],
  other: [{ en: "Other", ar: "أخرى" }],
};

export function getSubcategories(catId) {
  return SUBCATEGORIES[catId] || [];
}

export const CONDITIONS = [
  { id: "new", en: "Brand New", ar: "جديد", color: "bg-emerald-500 text-white" },
  { id: "like_new", en: "Like New", ar: "كالجديد", color: "bg-teal-500 text-white" },
  { id: "excellent", en: "Excellent", ar: "ممتاز", color: "bg-blue-500 text-white" },
  { id: "good", en: "Good", ar: "جيد", color: "bg-cyan-500 text-white" },
  { id: "fair", en: "Fair", ar: "مقبول", color: "bg-amber-500 text-white" },
  { id: "poor", en: "Poor", ar: "ضعيف", color: "bg-orange-500 text-white" },
];

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id) || (id === "used" ? CONDITIONS.find((c) => c.id === "good") : CONDITIONS[3]);
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

// Cities & location helpers now live in ./countries.js (re-exported above).

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