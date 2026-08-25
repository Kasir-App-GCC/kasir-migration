import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Terms() {
  const nav = useNavigate();
  const { lang } = useStore();
  const ar = lang === "ar";

  const sections = ar ? [
    { title: "1. قبول الشروط", body: "باستخدامك تطبيق كسر فإنك توافق على الالتزام بهذه الشروط والأحكام. إن لم توافق عليها، يرجى عدم استخدام التطبيق." },
    { title: "2. الأهلية", body: "يجب أن يكون عمرك 16 سنة على الأقل لإنشاء حساب واستخدام التطبيق. بإجرائك أي عملية داخل التطبيق فإنك تؤكد أنك مؤهل لذلك." },
    { title: "3. حسابك", body: "أنت مسؤول عن صحة المعلومات التي تقدّمها عند التسجيل (الاسم، رقم الجوال، البريد الإلكتروني) وعن الحفاظ على سرية كلمة المرور. يُمنع إنشاء أكثر من حساب أو استخدام حساب غيرك." },
    { title: "4. الإعلانات والبيع", body: "تتحمّل وحدك مسؤولية دقة الإعلانات التي تنشرها وصحة الأسعار وحالة المنتج وصوره. يُمنع نشر إعلانات مضلّلة أو مكررة أو لمنتجات محظورة. يحتفظ الإدارة بحق حذف أي إعلان أو تعطيله دون إذن مسبق." },
    { title: "5. المنتجات المحظورة", body: "يُمنع نشر أو بيع: المواد المقلدة، الأسلحة والذخائر، المخدرات والمواد المحظورة، الأدوية، المنتجات المنتهكة لحقوق الملكية الفكرية، وأي منتج يخالف الأنظمة المعمول بها في دول الخليج." },
    { title: "6. المعاملات واللقاءات", body: "كسر منصة لإتصال البائعين بالمشترين فقط، وليس طرفاً في أي صفقة. تتم جميع عمليات الدفع والتسليم بين المستخدمين مباشرةً وعلى مسؤوليتهم. ننصح بترتيب اللقاءات في أماكن عامة آمنة." },
    { title: "7. التقييمات", body: "التقييمات تعكس تجارب حقيقية بين المستخدمين. يُمنع التلاعب بالتقييمات أو إنشاء تقييمات وهمية. يحتفظ الإدارة بحق إخفاء أو حذف التقييمات المخالفة." },
    { title: "8. التوثيق", body: "شارة التوثيق تُمنح من الإدارة بعد التحقق من الهوية، وتُمنح أو تُسحب وفق تقدير الإدارة. التوثيق لا يعني ضماناً للتعامل مع المستخدم." },
    { title: "9. الترويج والإعلانات المميزة", body: "خدمة الترويج مدفوعة وتخضع لمراجعة الإدارة قبل التفعيل. الرسوم غير قابلة للاسترداد بعد تفعيل الترويج." },
    { title: "10. المسؤولية", body: "يقدّم التطبيق الخدمة «كما هي» دون أي ضمان. لا يتحمل كسر أي مسؤولية عن أضرار ناتجة عن تعاملات بين المستخدمين أو استخدام غير صحيح للتطبيق." },
    { title: "11. إنهاء الحساب", body: "يجوز للإدارة تعطيل أو حذف أي حساب يخالف هذه الشروط، أو حظر المستخدم نهائياً ومنعه من العودة للتطبيق." },
    { title: "12. التعديلات", body: "يجوز للإدارة تحديث هذه الشروط في أي وقت، ويسري التحديث فور نشره. استمرارك في استخدام التطبيق بعد التحديث يعني قبولك للشروط المعدّلة." },
  ] : [
    { title: "1. Acceptance of Terms", body: "By using Kasir, you agree to abide by these Terms & Conditions. If you do not agree, please do not use the app." },
    { title: "2. Eligibility", body: "You must be at least 16 years old to create an account and use the app. By performing any action in the app you confirm you are eligible to do so." },
    { title: "3. Your Account", body: "You are responsible for the accuracy of the information you provide at registration (name, phone, email) and for keeping your password confidential. Creating multiple accounts or using another person's account is prohibited." },
    { title: "4. Listings & Selling", body: "You are solely responsible for the accuracy of your listings — prices, item condition, and photos. Misleading, duplicate, or prohibited listings are not allowed. The administration reserves the right to remove or disable any listing without prior notice." },
    { title: "5. Prohibited Items", body: "You may not list or sell: counterfeit goods, weapons and ammunition, drugs and illegal substances, medications, items that violate intellectual property rights, or any product prohibited under Gulf regulations." },
    { title: "6. Transactions & Meetups", body: "Kasir is a platform connecting sellers with buyers only and is not a party to any deal. All payments and deliveries happen directly between users at their own responsibility. We recommend arranging meetups in safe public places." },
    { title: "7. Ratings", body: "Ratings reflect real experiences between users. Manipulating ratings or posting fake reviews is prohibited. The administration reserves the right to hide or delete violating reviews." },
    { title: "8. Verification", body: "The verified badge is granted by the administration after identity verification and may be granted or withdrawn at its discretion. Verification does not constitute a guarantee of dealing with a user." },
    { title: "9. Promotion & Featured Listings", body: "The promotion service is paid and subject to administration review before activation. Fees are non-refundable after a promotion is activated." },
    { title: "10. Liability", body: "The app is provided \"as is\" without any warranty. Kasir is not liable for damages arising from dealings between users or misuse of the app." },
    { title: "11. Account Termination", body: "The administration may disable or delete any account that violates these terms, or permanently ban a user from returning to the app." },
    { title: "12. Changes", body: "The administration may update these terms at any time; an update takes effect once published. Continued use of the app after an update means you accept the revised terms." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/90 backdrop-blur border-b border-border/60 z-10">
        <div className="max-w-2xl mx-auto h-14 flex items-center gap-3 px-4">
          <button onClick={() => nav(-1)} className="p-1.5 rounded-full hover:bg-muted">
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </button>
          <h1 className="font-bold text-lg">{ar ? "الشروط والأحكام" : "Terms & Conditions"}</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-muted-foreground">{ar ? "آخر تحديث: أغسطس 2025" : "Last updated: August 2025"}</p>
        {sections.map((s, i) => (
          <div key={i}>
            <h2 className="font-bold text-base mb-1.5">{s.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground selectable">{s.body}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-4 border-t border-border/60">
          {ar ? "للاستفسار عن هذه الشروط تواصل مع الدعم عبر صفحة الملف الشخصي." : "For questions about these terms, contact support from your profile page."}
        </p>
      </div>
    </div>
  );
}