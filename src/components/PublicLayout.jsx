import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Globe, ArrowRight } from "lucide-react";

export default function PublicLayout({ children }) {
  const { lang, setLang } = useStore();
  const t = useT();
  const nav = useNavigate();
  const ar = lang === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground" dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-lg tracking-tight">
            {ar ? "كاسر" : "Kasir"}
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            <Link to="/about" className="px-3 py-1.5 rounded-lg hover:bg-muted transition">
              {ar ? "من نحن" : "About"}
            </Link>
            <Link to="/contact" className="px-3 py-1.5 rounded-lg hover:bg-muted transition">
              {ar ? "تواصل معنا" : "Contact"}
            </Link>
            <button
              onClick={() => setLang(ar ? "en" : "ar")}
              className="px-2.5 py-1.5 rounded-lg hover:bg-muted transition flex items-center gap-1"
              aria-label="Toggle language"
            >
              <Globe size={15} />
              {ar ? "EN" : "ع"}
            </button>
            <button
              onClick={() => nav("/")}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 text-xs font-bold"
            >
              {ar ? "افتح التطبيق" : "Open app"}
              <ArrowRight size={14} className="rtl:rotate-180" />
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-border/60 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{ar ? "كاسر" : "Kasir"} © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-foreground transition">{ar ? "من نحن" : "About"}</Link>
            <Link to="/contact" className="hover:text-foreground transition">{ar ? "تواصل معنا" : "Contact"}</Link>
            <button onClick={() => nav("/")} className="hover:text-foreground transition">{ar ? "افتح التطبيق" : "Open app"}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}