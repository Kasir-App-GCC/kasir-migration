export function formatPrice(n, lang = "en") {
  const num = Number(n || 0).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  return lang === "ar" ? `${num} ر.س` : `${num} SAR`;
}

export function formatCompact(n, lang = "en") {
  if (n >= 1000) {
    const v = (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1);
    return lang === "ar" ? `${v} ألف` : `${v}k`;
  }
  return String(n);
}

export function timeAgo(date, lang = "en") {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  const ar = lang === "ar";
  if (diff < 60) return ar ? "الآن" : "now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return ar ? `قبل ${m} د` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return ar ? `قبل ${h} س` : `${h}h ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return ar ? `قبل ${d} يوم` : `${d}d ago`;
  }
  return new Date(date).toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
}