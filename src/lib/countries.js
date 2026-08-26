// Multi-country support: Saudi Arabia, UAE, Oman, Bahrain, Kuwait, Qatar.
// Each country has its own city list (with coordinates), phone code, and currency.

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
  { en: "Unaizah", ar: "عنيزة", lat: 26.0797, lng: 43.9839 },
  { en: "Ar Rass", ar: "الرس", lat: 25.8694, lng: 43.4981 },
  { en: "Al Mithnab", ar: "المذنب", lat: 26.2833, lng: 44.2 },
  { en: "Khamis Mushait", ar: "خميس مشيط", lat: 18.3, lng: 42.8 },
  { en: "Hail", ar: "حائل", lat: 27.5114, lng: 41.4208 },
  { en: "Hofuf", ar: "الهفوف", lat: 25.3833, lng: 49.5842 },
  { en: "Mubarraz", ar: "المبرز", lat: 25.4044, lng: 49.6464 },
  { en: "Najran", ar: "نجران", lat: 17.492, lng: 44.1328 },
  { en: "Jizan", ar: "جازان", lat: 16.8892, lng: 42.5511 },
  { en: "Sabya", ar: "صبيا", lat: 17.15, lng: 42.6167 },
  { en: "Abu Arish", ar: "أبو عريش", lat: 17.0, lng: 42.8333 },
  { en: "Samtah", ar: "صامتة", lat: 16.6, lng: 42.55 },
  { en: "Yanbu", ar: "ينبع", lat: 24.089, lng: 38.0618 },
  { en: "Jubail", ar: "الجبيل", lat: 27.0046, lng: 49.6606 },
  { en: "Qatif", ar: "القطيف", lat: 26.5254, lng: 50.0111 },
  { en: "Safwa", ar: "صفوى", lat: 26.6639, lng: 49.9581 },
  { en: "Saihat", ar: "سيهات", lat: 26.4833, lng: 50.0333 },
  { en: "Tarut", ar: "تاروت", lat: 26.5667, lng: 50.0667 },
  { en: "Awamiyah", ar: "العوامية", lat: 26.5786, lng: 49.9264 },
  { en: "Ras Tanura", ar: "رأس تنورة", lat: 26.6486, lng: 50.0481 },
  { en: "Arar", ar: "عرعر", lat: 30.9753, lng: 41.0389 },
  { en: "Sakaka", ar: "سكاكا", lat: 29.9697, lng: 40.2064 },
  { en: "Qurayyat", ar: "القريات", lat: 31.3333, lng: 37.3333 },
  { en: "Rafha", ar: "رفحاء", lat: 29.6333, lng: 43.5 },
  { en: "Turaif", ar: "طريف", lat: 31.675, lng: 38.6689 },
  { en: "Baha", ar: "الباحة", lat: 20.0129, lng: 41.4677 },
  { en: "Baljurashi", ar: "بلجرشي", lat: 19.85, lng: 41.5667 },
  { en: "Hafar Al-Batin", ar: "حفر الباطن", lat: 28.4994, lng: 46.1156 },
  { en: "Rabigh", ar: "رابغ", lat: 22.8044, lng: 39.0322 },
  { en: "Wadi Al-Dawasir", ar: "وادي الدواسر", lat: 20.4833, lng: 44.7167 },
  { en: "Afif", ar: "عفيف", lat: 23.9097, lng: 42.9167 },
  { en: "Sharurah", ar: "شرورة", lat: 17.45, lng: 47.11 },
  { en: "Al Qunfudhah", ar: "القنفذة", lat: 19.1269, lng: 41.1289 },
  { en: "Bisha", ar: "بيشة", lat: 19.9833, lng: 42.6 },
  { en: "Mahayil", ar: "محايل", lat: 18.55, lng: 42.05 },
  { en: "Al Ula", ar: "العلا", lat: 26.6167, lng: 37.9167 },
  { en: "Badr", ar: "بدر", lat: 23.7833, lng: 38.7833 },
  { en: "Diriyah", ar: "الدرعية", lat: 24.7519, lng: 46.5757 },
  { en: "Madinat Al-Sultan", ar: "مدينة سلطان", lat: 24.0, lng: 46.0 },
];

const UAE_CITIES = [
  { en: "Dubai", ar: "دبي", lat: 25.2048, lng: 55.2708 },
  { en: "Abu Dhabi", ar: "أبوظبي", lat: 24.4539, lng: 54.3773 },
  { en: "Sharjah", ar: "الشارقة", lat: 25.3463, lng: 55.4209 },
  { en: "Ajman", ar: "عجمان", lat: 25.4052, lng: 55.5236 },
  { en: "Al Ain", ar: "العين", lat: 24.2074, lng: 55.7447 },
  { en: "Ras Al Khaimah", ar: "رأس الخيمة", lat: 25.7853, lng: 55.9432 },
  { en: "Fujairah", ar: "الفجيرة", lat: 25.1164, lng: 56.3414 },
  { en: "Umm Al Quwain", ar: "أم القيوين", lat: 25.5647, lng: 55.5545 },
  { en: "Khor Fakkan", ar: "خور فكان", lat: 25.0664, lng: 56.2489 },
  { en: "Kalba", ar: "كلباء", lat: 25.0697, lng: 56.3229 },
  { en: "Dibba Al-Fujairah", ar: "دبا الفجيرة", lat: 25.4803, lng: 56.2677 },
  { en: "Dibba Al-Hisn", ar: "دبا الحصن", lat: 25.6, lng: 56.2667 },
  { en: "Ruwais", ar: "الرويس", lat: 24.2156, lng: 52.7222 },
  { en: "Hatta", ar: "حتا", lat: 24.8042, lng: 56.1036 },
  { en: "Madinat Zayed", ar: "مدينة زايد", lat: 23.65, lng: 53.7 },
  { en: "Liwa", ar: "ليوا", lat: 23.6333, lng: 53.8 },
  { en: "Ghayathi", ar: "الغياثي", lat: 23.9167, lng: 52.75 },
  { en: "Sila", ar: "السيلة", lat: 24.0, lng: 51.6167 },
  { en: "Delma", ar: "دلما", lat: 24.5, lng: 52.3 },
  { en: "Al Mirfa", ar: "المرفأ", lat: 24.2, lng: 53.4667 },
  { en: "Khalifa City", ar: "مدينة خليفة", lat: 24.4, lng: 54.6 },
  { en: "Baniyas", ar: "بني ياس", lat: 24.3833, lng: 54.6333 },
  { en: "Al Shamkha", ar: "الشامخة", lat: 24.55, lng: 54.7 },
  { en: "Al Wathba", ar: "الوثبة", lat: 24.3, lng: 54.7 },
  { en: "Masafi", ar: "مسافي", lat: 25.3, lng: 56.1667 },
];

const OMAN_CITIES = [
  { en: "Muscat", ar: "مسقط", lat: 23.588, lng: 58.3829 },
  { en: "Salalah", ar: "صلالة", lat: 17.0151, lng: 54.0924 },
  { en: "Sohar", ar: "صحار", lat: 24.3477, lng: 56.709 },
  { en: "Nizwa", ar: "نزوى", lat: 22.9333, lng: 57.5333 },
  { en: "Sur", ar: "صور", lat: 22.5667, lng: 59.5167 },
  { en: "Ibri", ar: "عبري", lat: 23.4167, lng: 56.4833 },
  { en: "Buraimi", ar: "البريمي", lat: 24.25, lng: 55.75 },
  { en: "Bahla", ar: "بهلا", lat: 23.0, lng: 57.3 },
  { en: "Rustaq", ar: "الرستاق", lat: 23.3833, lng: 57.4333 },
  { en: "Khasab", ar: "خصب", lat: 26.17, lng: 56.24 },
  { en: "Bawshar", ar: "بوشر", lat: 23.5858, lng: 58.4106 },
  { en: "Seeb", ar: "السيب", lat: 23.67, lng: 58.19 },
  { en: "Duqm", ar: "الدقم", lat: 22.5, lng: 59.4 },
  { en: "Ibra", ar: "إبراء", lat: 22.7167, lng: 58.5333 },
  { en: "Sinaw", ar: "سنو", lat: 22.6, lng: 57.9 },
  { en: "Izkī", ar: "إزكي", lat: 23.35, lng: 57.7667 },
  { en: "Sumail", ar: "سمائل", lat: 23.3, lng: 57.1833 },
  { en: "Bidbid", ar: "بدبد", lat: 23.4, lng: 57.8833 },
  { en: "Barka", ar: "بركا", lat: 23.6833, lng: 57.8667 },
  { en: "Musanah", ar: "المصنعة", lat: 23.7667, lng: 57.6333 },
  { en: "Nakhal", ar: "نخل", lat: 23.3833, lng: 57.8333 },
  { en: "Shinas", ar: "شناص", lat: 24.9667, lng: 56.4667 },
  { en: "Liwa", ar: "ليوا", lat: 24.5333, lng: 56.5667 },
  { en: "Mahdah", ar: "محضة", lat: 24.5, lng: 56.0833 },
  { en: "Adam", ar: "آدم", lat: 22.4, lng: 57.5167 },
  { en: "Haima", ar: "هيما", lat: 21.2833, lng: 56.9167 },
  { en: "Thumrait", ar: "ثمريت", lat: 17.6833, lng: 54.0167 },
  { en: "Taqah", ar: "طاقة", lat: 17.0333, lng: 54.4 },
  { en: "Mirbat", ar: "مرباط", lat: 16.9833, lng: 54.7 },
];

const BAHRAIN_CITIES = [
  { en: "Manama", ar: "المنامة", lat: 26.2285, lng: 50.586 },
  { en: "Muharraq", ar: "المحرق", lat: 26.2572, lng: 50.6117 },
  { en: "Riffa", ar: "الرفاع", lat: 26.13, lng: 50.555 },
  { en: "Hamad Town", ar: "مدينة حمد", lat: 26.1183, lng: 50.5082 },
  { en: "Isa Town", ar: "مدينة عيسى", lat: 26.1736, lng: 50.5477 },
  { en: "Sitra", ar: "سترة", lat: 26.13, lng: 50.65 },
  { en: "Budaiya", ar: "البديع", lat: 26.15, lng: 50.4833 },
  { en: "Jidhafs", ar: "جدحفص", lat: 26.2167, lng: 50.5667 },
  { en: "Sanabis", ar: "السنابس", lat: 26.2167, lng: 50.55 },
  { en: "Zallaq", ar: "الزلاق", lat: 26.05, lng: 50.4667 },
  { en: "Malkiya", ar: "مالكية", lat: 26.1333, lng: 50.5 },
  { en: "Hidd", ar: "الحد", lat: 26.1833, lng: 50.65 },
  { en: "A'ali", ar: "عالي", lat: 26.0833, lng: 50.5667 },
  { en: "Saar", ar: "سار", lat: 26.1667, lng: 50.4833 },
  { en: "Barbar", ar: "باربار", lat: 26.1833, lng: 50.4833 },
  { en: "Karzakan", ar: "كرزكان", lat: 26.1, lng: 50.45 },
  { en: "Duraz", ar: "الدراز", lat: 26.1833, lng: 50.4833 },
  { en: "Bani Jamra", ar: "بني جمرة", lat: 26.1667, lng: 50.4833 },
  { en: "Tubli", ar: "توبلي", lat: 26.1667, lng: 50.5833 },
  { en: "Nabih Saleh", ar: "نبيه صالح", lat: 26.1167, lng: 50.6167 },
  { en: "Samaheej", ar: "سماهيج", lat: 26.2333, lng: 50.65 },
  { en: "Askar", ar: "عسكر", lat: 26.05, lng: 50.6333 },
  { en: "Hamala", ar: "حالة", lat: 26.1333, lng: 50.45 },
];

const KUWAIT_CITIES = [
  { en: "Kuwait City", ar: "مدينة الكويت", lat: 29.3759, lng: 47.9774 },
  { en: "Hawalli", ar: "حولي", lat: 29.3339, lng: 48.0189 },
  { en: "Salmiya", ar: "السالمية", lat: 29.3394, lng: 48.0836 },
  { en: "Jahra", ar: "الجهراء", lat: 29.3375, lng: 47.6611 },
  { en: "Ahmadi", ar: "الأحمدي", lat: 29.0769, lng: 48.075 },
  { en: "Farwaniya", ar: "الفروانية", lat: 29.2744, lng: 47.9586 },
  { en: "Mubarak Al-Kabeer", ar: "مبارك الكبير", lat: 29.2019, lng: 48.0594 },
  { en: "Mahboula", ar: "المهبولة", lat: 29.1572, lng: 48.0267 },
  { en: "Fahaheel", ar: "الفحيحيل", lat: 29.075, lng: 48.1333 },
  { en: "Khaitan", ar: "خيطان", lat: 29.25, lng: 47.9667 },
  { en: "Jabriya", ar: "الجابرية", lat: 29.3333, lng: 48.05 },
  { en: "Bayan", ar: "بيان", lat: 29.3, lng: 48.0667 },
  { en: "Shuwaikh", ar: "الشويخ", lat: 29.35, lng: 47.9667 },
  { en: "Kaifan", ar: "كيفان", lat: 29.3333, lng: 48.0 },
  { en: "Adailiya", ar: "العديلية", lat: 29.35, lng: 47.9667 },
  { en: "Mansouriya", ar: "المنصورية", lat: 29.3333, lng: 47.9667 },
  { en: "Qadsiya", ar: "القادسية", lat: 29.3333, lng: 48.0167 },
  { en: "Yarmouk", ar: "اليرموك", lat: 29.3, lng: 48.0333 },
  { en: "Rumaithiya", ar: "الرميثية", lat: 29.3167, lng: 48.0833 },
  { en: "Salwa", ar: "سلوى", lat: 29.3333, lng: 48.0833 },
  { en: "Shaab", ar: "الشعب", lat: 29.3333, lng: 48.0667 },
  { en: "Rawda", ar: "الروضة", lat: 29.3, lng: 48.0667 },
  { en: "Qortuba", ar: "قرطبة", lat: 29.3, lng: 48.0833 },
  { en: "Daiya", ar: "الدعية", lat: 29.3167, lng: 48.05 },
  { en: "Bida", ar: "البدع", lat: 29.3333, lng: 48.0667 },
  { en: "Andalous", ar: "الأندلس", lat: 29.3, lng: 47.9833 },
  { en: "Nuzha", ar: "النزهة", lat: 29.3, lng: 48.0 },
  { en: "Mangaf", ar: "المقوع", lat: 29.15, lng: 48.1333 },
  { en: "Fintas", ar: "الفنيطيس", lat: 29.1833, lng: 48.1333 },
  { en: "Abu Halifa", ar: "أبو حليفة", lat: 29.1, lng: 48.1333 },
  { en: "Wafra", ar: "الوفرة", lat: 28.6, lng: 48.3333 },
  { en: "Subhan", ar: "صبحان", lat: 29.2167, lng: 47.95 },
  { en: "Shuaiba", ar: "الشعيبة", lat: 29.05, lng: 48.0833 },
];

const QATAR_CITIES = [
  { en: "Doha", ar: "الدوحة", lat: 25.2854, lng: 51.531 },
  { en: "Al Rayyan", ar: "الريان", lat: 25.2919, lng: 51.4244 },
  { en: "Al Wakrah", ar: "الوكرة", lat: 25.175, lng: 51.6033 },
  { en: "Al Wukair", ar: "الوكير", lat: 25.1833, lng: 51.55 },
  { en: "Al Khor", ar: "الخور", lat: 25.68, lng: 51.5 },
  { en: "Dukhan", ar: "دخان", lat: 25.2, lng: 50.8 },
  { en: "Mesaieed", ar: "مسيعيد", lat: 24.99, lng: 51.55 },
  { en: "Madinat ash Shamal", ar: "مدينة الشمال", lat: 26.03, lng: 51.2 },
  { en: "Umm Salal", ar: "أم صلال", lat: 25.4, lng: 51.4 },
  { en: "Umm Salal Mohammed", ar: "أم صلال محمد", lat: 25.4167, lng: 51.4 },
  { en: "Al Daayen", ar: "الضعاين", lat: 25.5, lng: 51.4 },
  { en: "Lusail", ar: "لوسيل", lat: 25.65, lng: 51.5 },
  { en: "Al Ghuwariyah", ar: "الغارية", lat: 25.7, lng: 51.3 },
  { en: "Al Ruwais", ar: "الرويس", lat: 26.1167, lng: 51.2167 },
  { en: "Al Jumail", ar: "الجميل", lat: 26.0667, lng: 51.1833 },
  { en: "Abu Dhalouf", ar: "أبو ظلوف", lat: 26.0833, lng: 51.1667 },
  { en: "Al Zubarah", ar: "الزبارة", lat: 25.9667, lng: 51.3333 },
  { en: "Fuwayrit", ar: "فويرط", lat: 26.0333, lng: 51.3333 },
  { en: "Al Jemailiya", ar: "الجميلية", lat: 25.8, lng: 51.1833 },
  { en: "Umm Bab", ar: "أم باب", lat: 25.2, lng: 50.85 },
  { en: "Shahaniya", ar: "الشحانية", lat: 25.3667, lng: 51.2167 },
  { en: "Sumaisma", ar: "سميسمة", lat: 25.5833, lng: 51.5 },
  { en: "Ras Laffan", ar: "رأس لفان", lat: 26.0833, lng: 51.5333 },
];

export const COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "السعودية", flag: "🇸🇦", phoneCode: "966", currency: "SAR", currencyAr: "ر.س", cities: SAUDI_CITIES },
  { code: "AE", en: "UAE", ar: "الإمارات", flag: "🇦🇪", phoneCode: "971", currency: "AED", currencyAr: "د.إ", cities: UAE_CITIES },
  { code: "OM", en: "Oman", ar: "عُمان", flag: "🇴🇲", phoneCode: "968", currency: "OMR", currencyAr: "ر.ع.", cities: OMAN_CITIES },
  { code: "BH", en: "Bahrain", ar: "البحرين", flag: "🇧🇭", phoneCode: "973", currency: "BHD", currencyAr: "د.ب", cities: BAHRAIN_CITIES },
  { code: "KW", en: "Kuwait", ar: "الكويت", flag: "🇰🇼", phoneCode: "965", currency: "KWD", currencyAr: "د.ك", cities: KUWAIT_CITIES },
  { code: "QA", en: "Qatar", ar: "قطر", flag: "🇶🇦", phoneCode: "974", currency: "QAR", currencyAr: "ر.ق", cities: QATAR_CITIES },
];

export const ALL_CITIES = COUNTRIES.flatMap((c) => c.cities.map((city) => ({ ...city, country: c.code })));

export function getCountry(code) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}

// Approximate static exchange rates: units of local currency per 1 SAR.
// Derived from the GCC USD pegs (1 USD ≈ 3.75 SAR). For display only — not live.
export const RATES_PER_SAR = {
  SA: 1,
  AE: 0.98,
  OM: 0.1025,
  BH: 0.1003,
  KW: 0.0819,
  QA: 0.9707,
};

export function convertCurrency(amount, fromCode, toCode) {
  const f = RATES_PER_SAR[fromCode] ?? 1;
  const t = RATES_PER_SAR[toCode] ?? 1;
  return Number(amount || 0) * (t / f);
}

export function getCities(code) {
  return getCountry(code).cities;
}

export function getCountryByPhoneCode(phoneCode) {
  return COUNTRIES.find((c) => c.phoneCode === String(phoneCode).replace("+", ""));
}

export function nearestCityInCountry(lat, lng, code) {
  const cities = getCities(code);
  let best = null;
  let min = Infinity;
  for (const c of cities) {
    if (!c.lat || !c.lng) continue;
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < min) { min = d; best = c; }
  }
  return best;
}

// Resolves a reverse-geocoded result { name, city, state } to a canonical city
// from the country's city list. Prefers the state/region match so a sub-
// municipality (e.g. "Diriyah" within Riyadh Region) resolves to its major
// city ("Riyadh") instead of the smaller locality. Returns null if no match.
export function resolveCityFromGeocode(geocoded, code) {
  if (!geocoded) return null;
  const cities = getCities(code);
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/region|منطقة|province|محافظة|emirate|إمارة/gi, "")
      .replace(/[^a-z0-9\u0600-\u06ff]/g, "");
  const tryMatch = (val) => {
    const raw = norm(val);
    if (raw.length < 3) return null;
    return cities.find((c) => {
      const ce = norm(c.en);
      const ca = norm(c.ar);
      return raw === ce || raw === ca || raw.includes(ce) || raw.includes(ca);
    });
  };
  return tryMatch(geocoded.state) || tryMatch(geocoded.city) || null;
}

export function nearestCity(lat, lng) {
  let best = null;
  let min = Infinity;
  for (const c of ALL_CITIES) {
    if (!c.lat || !c.lng) continue;
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < min) { min = d; best = c; }
  }
  return best;
}

function distKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Returns the canonical city names within radiusKm of the given city — used to
// broaden a city filter server-side so neighborhoods/sub-cities (e.g. Diriyah
// within Riyadh) are returned alongside the major city.
export function nearbyCities(cityEn, code, radiusKm = 25) {
  const cities = getCities(code);
  const center = cities.find((c) => c.en === cityEn);
  if (!center || !center.lat) return [cityEn];
  return cities.filter((c) => c.lat && distKm(center, c) <= radiusKm).map((c) => c.en);
}

export function lookupCityCountry(name) {
  if (!name) return null;
  for (const c of COUNTRIES) {
    if (c.cities.some((city) => city.en === name || city.ar === name)) return c.code;
  }
  return null;
}

export function getCityName(value, lang = "en") {
  if (!value) return lang === "ar" ? "كل المدن" : "All cities";
  const c = ALL_CITIES.find((x) => x.en === value || x.ar === value);
  return c ? (lang === "ar" ? c.ar : c.en) : value;
}