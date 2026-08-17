import RiyalSymbol from "@/components/RiyalSymbol";

export default function Price({ value, lang, className = "" }) {
  const num = Number(value || 0).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  return (
    <span dir="ltr" className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <RiyalSymbol size={13} />
      <span>{num}</span>
    </span>
  );
}