export default function Price({ value, lang, className = "" }) {
  const num = Number(value || 0).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      {lang === "ar" ? <>{num} ر.س</> : <>SAR {num}</>}
    </span>
  );
}