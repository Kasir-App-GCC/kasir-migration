import { getCountry, convertCurrency } from "@/lib/countries";

export function formatPrice(n, lang = "en", fromCountry = "SA", toCountry) {
  const to = toCountry || fromCountry;
  const converted = convertCurrency(n, fromCountry, to);
  const c = getCountry(to);
  const num = Math.round(converted).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  return lang === "ar" ? `${num} ${c.currencyAr}` : `${c.currency} ${num}`;
}

export function formatCompact(n, lang = "en") {
  if (n >= 1000) {
    const v = (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1);
    return lang === "ar" ? `${v} ألف` : `${v}k`;
  }
  return String(n);
}

export function toDate(date) {
  const s = String(date);
  const hasTz = /Z$/i.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasTz ? s : s + "Z");
}

function arNum(n) {
  return new Intl.NumberFormat("ar-SA").format(n);
}
function arNoun(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return few;
  return many;
}

export function timeAgo(date, lang = "en") {
  const d = toDate(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  const ar = lang === "ar";
  if (diff < 60) return ar ? "الآن" : "now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    if (ar) return `قبل ${arNum(m)} ${arNoun(m, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}`;
    return `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    if (ar) return `قبل ${arNum(h)} ${arNoun(h, "ساعة", "ساعتين", "ساعات", "ساعة")}`;
    return `${h}h ago`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    if (ar) return `قبل ${arNum(days)} ${arNoun(days, "يوم", "يومين", "أيام", "يوماً")}`;
    return `${days}d ago`;
  }
  return d.toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
}