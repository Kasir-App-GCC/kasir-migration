import CurrencySymbol from "@/components/CurrencySymbol";
import { useStore } from "@/lib/store";
import { convertCurrency } from "@/lib/countries";

export default function Price({ value, lang, country, className = "" }) {
  const { lang: storeLang, country: storeCountry } = useStore();
  const lng = lang || storeLang;
  const toCode = storeCountry || "SA";
  const fromCode = country || toCode;
  const converted = convertCurrency(value, fromCode, toCode);
  const num = Math.round(converted).toLocaleString(lng === "ar" ? "ar-SA" : "en-US");
  return (
    <span dir="ltr" className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <CurrencySymbol country={toCode} lang={lng} size={13} />
      <span>{num}</span>
    </span>
  );
}