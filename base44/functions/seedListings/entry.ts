import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CITIES = {
  SA: [
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
    { en: "Hail", ar: "حائل", lat: 27.5114, lng: 41.4208 },
    { en: "Najran", ar: "نجران", lat: 17.492, lng: 44.1328 },
  ],
  AE: [
    { en: "Dubai", ar: "دبي", lat: 25.2048, lng: 55.2708 },
    { en: "Abu Dhabi", ar: "أبوظبي", lat: 24.4539, lng: 54.3773 },
    { en: "Sharjah", ar: "الشارقة", lat: 25.3463, lng: 55.4209 },
    { en: "Ajman", ar: "عجمان", lat: 25.4052, lng: 55.5236 },
    { en: "Al Ain", ar: "العين", lat: 24.2074, lng: 55.7447 },
    { en: "Ras Al Khaimah", ar: "رأس الخيمة", lat: 25.7853, lng: 55.9432 },
    { en: "Fujairah", ar: "الفجيرة", lat: 25.1164, lng: 56.3414 },
    { en: "Umm Al Quwain", ar: "أم القيوين", lat: 25.5647, lng: 55.5545 },
  ],
  OM: [
    { en: "Muscat", ar: "مسقط", lat: 23.588, lng: 58.3829 },
    { en: "Salalah", ar: "صلالة", lat: 17.0151, lng: 54.0924 },
    { en: "Sohar", ar: "صحار", lat: 24.3477, lng: 56.709 },
    { en: "Nizwa", ar: "نزوى", lat: 22.9333, lng: 57.5333 },
    { en: "Sur", ar: "صور", lat: 22.5667, lng: 59.5167 },
    { en: "Buraimi", ar: "البريمي", lat: 24.25, lng: 55.75 },
    { en: "Rustaq", ar: "الرستاق", lat: 23.3833, lng: 57.4333 },
    { en: "Barka", ar: "بركا", lat: 23.6833, lng: 57.8667 },
  ],
  BH: [
    { en: "Manama", ar: "المنامة", lat: 26.2285, lng: 50.586 },
    { en: "Muharraq", ar: "المحرق", lat: 26.2572, lng: 50.6117 },
    { en: "Riffa", ar: "الرفاع", lat: 26.13, lng: 50.555 },
    { en: "Hamad Town", ar: "مدينة حمد", lat: 26.1183, lng: 50.5082 },
    { en: "Isa Town", ar: "مدينة عيسى", lat: 26.1736, lng: 50.5477 },
    { en: "Sitra", ar: "سترة", lat: 26.13, lng: 50.65 },
    { en: "Hidd", ar: "الحد", lat: 26.1833, lng: 50.65 },
    { en: "A'ali", ar: "عالي", lat: 26.0833, lng: 50.5667 },
  ],
  KW: [
    { en: "Kuwait City", ar: "مدينة الكويت", lat: 29.3759, lng: 47.9774 },
    { en: "Hawalli", ar: "حولي", lat: 29.3339, lng: 48.0189 },
    { en: "Salmiya", ar: "السالمية", lat: 29.3394, lng: 48.0836 },
    { en: "Jahra", ar: "الجهراء", lat: 29.3375, lng: 47.6611 },
    { en: "Ahmadi", ar: "الأحمدي", lat: 29.0769, lng: 48.075 },
    { en: "Farwaniya", ar: "الفروانية", lat: 29.2744, lng: 47.9586 },
    { en: "Fahaheel", ar: "الفحيحيل", lat: 29.075, lng: 48.1333 },
    { en: "Mahboula", ar: "المهبولة", lat: 29.1572, lng: 48.0267 },
  ],
  QA: [
    { en: "Doha", ar: "الدوحة", lat: 25.2854, lng: 51.531 },
    { en: "Al Rayyan", ar: "الريان", lat: 25.2919, lng: 51.4244 },
    { en: "Al Wakrah", ar: "الوكرة", lat: 25.175, lng: 51.6033 },
    { en: "Al Khor", ar: "الخور", lat: 25.68, lng: 51.5 },
    { en: "Dukhan", ar: "دخان", lat: 25.2, lng: 50.8 },
    { en: "Lusail", ar: "لوسيل", lat: 25.65, lng: 51.5 },
    { en: "Umm Salal", ar: "أم صلال", lat: 25.4, lng: 51.4 },
    { en: "Al Daayen", ar: "الضعاين", lat: 25.5, lng: 51.4 },
  ],
};

const CATS = {
  electronics: { titles: ["آيفون ١٤ برو ماكس","سامسونج جالكسي S23","لابتوب ماك بوك برو","آيباد برو","شاشة سامسونج ٥٥ بوصة","سماعات بلوتوث","بلايستيشن ٥","ساعة آبل","كاميرا كانون","سماعة جي بي إل","تابلت سامسونج","شاحن سريع"], sub: ["Phones","Laptops","Tablets","Audio","Gaming","Accessories"], price: [200, 8000] },
  cars: { titles: ["تويوتا كامري ٢٠٢١","هيونداي سوناتا","نيسان باترول","مرسيدس C200","بي إم دبليو X5","لكزس ES","كيا سيراتو","هوندا أكورد","مازدا 6","شيفروليه تاهو","فورد إكسبلورر","جيب رانجلر"], sub: ["Sedan","SUV / 4x4","Motorcycles","Parts & Accessories"], price: [15000, 300000] },
  furniture: { titles: ["أريكة جلدية","طاولة طعام خشب","خزانة ملابس","سرير كينج","مكتب كمبيوتر","كرسي مكتب فاخر","طاولة قهوة","رف كتب","عفش غرفة نوم","أنارة حديثة","مكينة خياطة","تلفاز"], sub: ["Sofas","Beds","Tables & Chairs","Storage","Decor"], price: [50, 5000] },
  fashion: { titles: ["ساعة رجالية","حقيبة يد نسائية","جاكيت جلد","حذاء رياضي","نظارة شمسية","عطر فرنسي","قمياس رجالي","فستان سهرة","محفظة جلد","شال كشمير","حزام جلد","نظارة طبية"], sub: ["Men","Women","Kids","Shoes","Bags","Accessories"], price: [30, 3000] },
  realestate: { titles: ["شقة ٣ غرف","فيلا ٥ غرف","أرض سكنية","استوديو مفروش","دوبلكس راقي","محل تجاري","مكتب إداري","شاليه بحري","مزرعة","عمارة سكنية","شقة لوفت","أرض تجارية"], sub: ["For Sale","For Rent","Apartments","Villas","Land"], price: [500, 500000] },
  services: { titles: ["تنظيف منازل","صيانة مكيفات","نقل عفش","دروس خصوصية","تنظيف سيارات","كهربائي محترف","سباكة","نجارة","حدادة","تصميم ديكور","صيانة سباكة","تنظيف خزانات"], sub: ["Cleaning","Maintenance","Tutoring","Transport","Events"], price: [50, 2000] },
  toys: { titles: ["ألعاب أطفال","ألعاب تعليمية","دراجة أطفال","لعبة لوحية","مجسم أكشن","دمية محبوبة","ألعاب تركيب","سيارة تحكم","بازل كبير","ألعاب حركية","مكعبات","لعبة ريموت"], sub: ["Kids Toys","Board Games","Collectibles"], price: [20, 800] },
  sports: { titles: ["جهاز جري","أثقال رياضية","دراجة هوائية","كرة قدم","مضرب تنس","حذاء رياضي","زلة رياضية","قفازات ملاكمة","حقيبة رياضية","ساعة رياضية","كرة سلة","شبكة كرة طائرة"], sub: ["Fitness","Bicycles","Team Sports","Outdoor"], price: [40, 4000] },
  books: { titles: ["كتب مدرسية","روايات عربية","كتب دينية","كتب أطفال","موسوعة علمية","كتب تاريخ","كتب علمية","روايات مترجمة","كتب طبخ","كتب تطوير ذات","قاموس","كتب أدب"], sub: ["Textbooks","Novels","Religious","Children"], price: [10, 300] },
  animals: { titles: ["مهر أصيل","طيور زينة","قطط شيرازي","كلاب حراسة","أسماك زينة","مستلزمات حيوانات","أعلاف","أقفاص","إبل","ماعز","ببغاء","دجاج"], sub: ["Livestock","Pets","Birds","Fish","Supplies"], price: [30, 20000] },
  jobs: { titles: ["مطلوب محاسب","مطلوب مهندس","مطلوب مدرس","مطلوب سكرتير","مطلوب بائع","مطلوب سائق","مطلوب حارس","مطلوب طباخ","مطلوب مصمم","مطلوب مبرمج","مطلوب ممرض","مطلوب فني"], sub: ["Full-time","Part-time","Freelance"], price: [2000, 25000] },
  education: { titles: ["دروس خصوصية","دورات لغة إنجليزية","تدريب إداري","كورس برمجة","تدريب قيادة","دورات تصميم","تدريب تسويق","دورات محاسبة","تدريب طبي","دورات تطوير ذات","أيلتس","توفل"], sub: ["Tutoring","Courses","Training"], price: [100, 5000] },
  occasions: { titles: ["تنسيق أعراس","قاعة مناسبات","تقديم طعام","تأجير كراسي","تنظيم حفلات","باقات ورد","شوكولاتة فاخرة","توزيعات","إضاءة","ديكور مناسبات","فرقة","تصوير مناسبات"], sub: ["Weddings","Parties","Catering","Rentals"], price: [100, 30000] },
  antiques: { titles: ["عملات نادرة","تراثيات","مقتنيات","سجاد قديم","نحاسيات","خناجر تراثية","تحف","طوابع","مخطوطات","أواني قديمة","سيف","بخور"], sub: ["Coins","Heritage","Collectibles"], price: [50, 10000] },
  arts: { titles: ["لوحات زيتية","حرف يدوية","خط عربي","منحوتات","صور فنية","أعمال يدوية","ديكور جداري","رسومات","أقلام خط","إطارات","نحت","تلوين"], sub: ["Paintings","Handicrafts","Calligraphy"], price: [30, 5000] },
  families: { titles: ["معجنات بلدية","حلويات منزلية","عطور وعود","أكلات شعبية","منتجات ألبان","عسل طبيعي","مخللات","كسكسي","مربيات","حرف يدوية","زيت زيتون","تمور"], sub: ["Food","Bakery & Sweets","Handicrafts","Perfumes & Oud","Clothing"], price: [20, 1500] },
  other: { titles: ["مستلزمات عامة","أدوات منزلية","معدات","بضاعة متنوعة","إكسسوارات","مستعمل","جديد","للبيع","فرصة","تشطيب","أدوات","عامة"], sub: ["Other"], price: [10, 2000] },
};

const CONDITIONS = ["new","like_new","excellent","good","fair","poor"];
const NAMES = ["أحمد","محمد","عبدالله","خالد","سعد","فهد","ناصر","سلطان","ماجد","تركي","بدر","يوسف","إبراهيم","عمر","فيصل","سلمان","راكان","نواف","مشاري","هاني","وليد","طارق","زياد","مازن","أنس","حمود","شادي","ربيع","سامي","حمد"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function genListing(country, i) {
  const catKeys = Object.keys(CATS);
  const cat = rand(catKeys);
  const cfg = CATS[cat];
  const base = rand(cfg.titles);
  const cond = rand(CONDITIONS);
  const city = rand(CITIES[country]);
  const name = rand(NAMES);
  const sellerIdx = randInt(0, 499);
  const numImgs = 1 + Math.floor(Math.random() * 3);
  const imgs = Array.from({ length: numImgs }, (_, k) => `https://picsum.photos/seed/${country}${i}${k}/600/600`);
  const price = randInt(cfg.price[0], cfg.price[1]);
  const condLabel = cond === "new" ? "جديد" : cond === "like_new" ? "كالجديد" : "مستعمل";
  return {
    title: `${base} - ${condLabel}`,
    description: `للبيع ${base}، حالة ${condLabel}. السعر قابل للتفاوض. ${city.ar}.`,
    price,
    images: imgs,
    category: cat,
    subcategory: cfg.sub ? [rand(cfg.sub)] : undefined,
    condition: cond,
    city: city.en,
    location_name: city.ar,
    country,
    lat: city.lat + (Math.random() - 0.5) * 0.08,
    lng: city.lng + (Math.random() - 0.5) * 0.08,
    seller_id: `seed-${country}-${sellerIdx}`,
    seller_name: name,
    seller_avatar: null,
    status: Math.random() < 0.04 ? "sold" : "available",
    views: randInt(0, 250),
  };
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const country = body.country || "SA";
    const count = Math.min(Number(body.count) || 10000, 10000);
    const batchSize = Math.min(Number(body.batchSize) || 500, 500);
    if (!CITIES[country]) return Response.json({ error: "Unknown country: " + country }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    const created = [];
    let total = 0;
    for (let off = 0; off < count; off += batchSize) {
      const n = Math.min(batchSize, count - off);
      const batch = [];
      for (let j = 0; j < n; j++) {
        batch.push(genListing(country, off + j));
      }
      const res = await base44.asServiceRole.entities.Item.bulkCreate(batch);
      created.push(Array.isArray(res) ? res.length : (res && res.length) || n);
      total += n;
    }
    return Response.json({ country, created: total, batches: created.length });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}