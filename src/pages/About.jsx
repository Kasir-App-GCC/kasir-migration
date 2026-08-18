import React from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { useStore } from "@/lib/store";
import { MapPin, MessageSquare, Heart, Shield, Users, Tag } from "lucide-react";

export default function About() {
  const { lang } = useStore();
  const ar = lang === "ar";

  const features = [
    { icon: MapPin, en: "Location-based discovery — find items listed near you across the GCC", ar: "اكتشاف حسب الموقع — جد إعلانات قريبة منك في كل الخليج" },
    { icon: MessageSquare, en: "Real-time chat and offer system to negotiate directly with sellers", ar: "محادثات وعروض لحظية للتفاوض مباشرة مع البائعين" },
    { icon: Heart, en: "Save favorite listings and revisit them anytime", ar: "احفظ إعلاناتك المفضلة ورجع لها أي وقت" },
    { icon: Users, en: "Dedicated section for productive families to showcase homemade goods", ar: "قسم مخصص للأسر المنتجة لعرض منتجاتها المنزلية" },
    { icon: Shield, en: "Trust badges and ratings to build a safe, reliable community", ar: "شارات ثقة وتقييمات لبناء مجتمع آمن وموثوق" },
    { icon: Tag, en: "Bilingual interface in English and Saudi Arabic dialect", ar: "واجهة ثنائية اللغة بالإنجليزية واللهجة السعودية" },
  ];

  return (
    <PublicLayout>
      <article>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          {ar ? "من نحن — كاسر" : "About Kasir"}
        </h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-base leading-relaxed">
          {ar ? (
            <>
              <p>
                <strong>كاسر</strong> هو سوق محلي للبيع والشراء في دول مجلس التعاون الخليجي. مستوحى من اللهجة السعودية — حيث "كاسر" تعني المساومة على السعر — يتيح لك تطبيقنا التفاوض على الأسعار، واكتشاف الإعلانات القريبة منك، والتواصل المباشر مع البائعين في مدينتك. سواء كنت تبحث عن إلكترونيات أو أثاث أو سيارات أو منتجات منزلية من الأسر المنتجة، كاسر يوصل السوق إلى جوالك.
              </p>
              <p>
                صُمم كاسر للجميع في الخليج: المشترين الذين يبحثون عن عروض قريبة، والبائعين الذين يريدون الوصول إلى عملاء محليين، والأسر المنتجة التي تعرض منتجاتها المنزلية لجمهور أوسع. نظام التصفية حسب الموقع يساعدك على إيجاد المنتجات في مدينتك، بينما المحادثات والعروض اللحظية تجعل التفاوض سهلاً وسريعاً.
              </p>
              <p>
                بُني كاسر بفريق متحمس لإنشاء سوق موثوق يحترم اللهجة المحلية ويدعم التجارة المحلية والأسر المنتجة في جميع أنحاء الخليج. هدفنا أن نكون المنصة الأولى للتبادل التجاري بين الأفراد في المنطقة، بواجهة بسيطة وتجربة آمنة تعزز الثقة بين المستخدمين.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Kasir</strong> is a local marketplace built for buying and selling across the Gulf Cooperation Council region. Inspired by the Saudi dialect — where "kasir" means to haggle — our app lets you negotiate prices, discover listings near you, and connect directly with sellers in your city. Whether you are searching for electronics, furniture, vehicles, or handmade goods from productive families, Kasir brings the marketplace to your fingertips.
              </p>
              <p>
                Kasir is designed for everyone in the GCC: buyers looking for great deals nearby, sellers wanting to reach local customers, and productive families showcasing their homemade products to a wider audience. Our location-based filtering helps you find items in your city, while our real-time chat and offer system makes negotiating simple and instant.
              </p>
              <p>
                Kasir is built by a dedicated team passionate about creating a trusted, community-driven marketplace that respects the local dialect and empowers local commerce and productive families across the Gulf. Our goal is to be the leading platform for person-to-person trade in the region, with a simple interface and a safe experience that builds trust between users.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/60">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon size={18} className="text-primary" />
              </div>
              <p className="text-sm leading-relaxed pt-1">{ar ? f.ar : f.en}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/contact" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            {ar ? "تواصل معنا" : "Contact us"}
          </Link>
          <Link to="/" className="px-5 py-2.5 rounded-xl bg-muted text-sm font-bold hover:bg-muted/70 transition">
            {ar ? "ابدأ التصفح" : "Start browsing"}
          </Link>
        </div>
      </article>
    </PublicLayout>
  );
}