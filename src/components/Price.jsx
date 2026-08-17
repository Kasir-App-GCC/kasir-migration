import CurrencySymbol from "@/components/CurrencySymbol";
import { useStore } from "@/lib/store";

export default function Price({ value, lang, country, className = "" }) {
  const { lang: storeLang, country: storeCountry } = useStore();
  const lng = lang || storeLang;
  const code = country || storeCountry || "SA";
  const num = Number(value || 0).toLocaleString(lng === "ar" ? "ar-SA" : "en-US");
  return (
    <span dir="ltr" className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <CurrencySymbol country={code} lang={lng} size={13} />
      <span>{num}</span>
    </span>
  );
}