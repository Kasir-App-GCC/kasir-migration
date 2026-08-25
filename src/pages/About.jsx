import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const STORY = `👋 من وين بدأت الحكاية؟

كل شيء بدأ في جلسة بلوت 🃏😂

أربعة أصدقاء يلعبون، وأحدهم —محدثكم — كان مقبلًا على الزواج 💍 (عقبالكم)، وبدأ يجهّز نفسه للمرحلة الجديدة: تأثيث بيت الزوجية 🏠.

لكن كانت عنده مشكلة بسيطة… أو خلونا نقول: مشكلة كنب وطاولات ومرتبة وسرير وعفش عزوبية كامل 😂🛋️🛏️

فسأل أصحابه بكل براءة:

««شباب، مين يبي يشتري عفش البيت؟ كنب؟ طاولات؟ مرتبة سرير؟ سرير؟…»»

وكان الرد الجماعي بكل حب واهتمام:

««العب وانت ساكت.» 😂😂»

وانتهت الجولة، وانتهى معها الموضوع… أو هذا اللي كنا نظنه.

بعدها بشوي، احد الأصدقاء سأل:

««شباب، أحد يعرف من وين أشتري مشغل فيديوهات قديم؟» 📼🤔»

وهنا… ولعت لمبة. 💡😂

قلنا: لحظة! ----- (تعبير)
ليش ما يكون فيه تطبيق واحد تدخل عليه، وتلقى فيه الأشياء اللي الناس ما عاد يحتاجونها، وتبيع أغراضك بسهولة، وتشتري اللي تحتاجه، وتبحث عن الشيء اللي تبيه؟ (ويكون سهل وسلس ومريح)

يعني لو جارك عنده مشغل الفيديوهات الأسطوري 📼، وكنت أنت تدور عليه، يطلع لك في التطبيق، تتواصل معه، وتشتريه منه.

وبنفس الوقت، إذا عندك شيء ما عاد تحتاجه، لا ترميه! ♻️
يمكن شخص ثاني يدور عليه من فترة، ويكون مستعد يشتريه منك. ❤️

😂 طيب والعريس؟

نبشركم… العريس ما استفاد من الفكرة!

لأن التطبيق كان لا يزال تحت الإنشاء، والعفش كان مستعجل أكثر منا 😂🛋️

فاضطر الرجال — الله يكتب أجره — يعطي العفش لجمعية خيرية ❤️🤲

وقلنا وقتها:

««عادي… للمستقبل!» 😂»

يعني صحيح ما لحقنا ننقذ عفش العريس، لكن قلنا نسوي شيء يمكن ينقذ عفش غيره مستقبلًا! 😎

ومن هنا قررنا نطبّق الفكرة ونصمم تطبيق يكون سهل جدًا للبيع والشراء، بدون تعقيد ولا إجراءات طويلة.

📸 تبي تبيع؟ أسهل مما تتوقع!

ما تحتاج تكون تاجر، ولا خبير في الإعلانات، ولا تكتب مقال عن المنتج 😂

صوّر 📸 → حدد السعر 💰 → انشر 🚀

بس!

تصوّر الشيء من داخل التطبيق، تحدد سعره، تضيف المعلومات اللي تبيها، وتنشر الإعلان.

وبكذا صار عندك إعلان جاهز للناس اللي تبحث عن الشيء اللي تبي تبيعه.

وتقدر تبحث عن الأشياء اللي تبيها، وتستخدم المسافة كأحد خيارات البحث إذا كان يهمك تلقى الشيء الأقرب لك 📍، أو تبحث بالطريقة اللي تناسبك.

الفكرة ببساطة:

الشيء اللي ما تحتاجه أنت، يمكن يكون بالضبط الشيء اللي يحتاجه غيرك. ❤️

🚫 وقلنا: الإعلانات؟ لا شكرًا!

لأننا مثل أي مستخدم… ما نحب تدخل تطبيق وتلقى الإعلانات تطاردك من كل زاوية 😂📢

لذلك قررنا ما نضيف إعلانات داخل التطبيق، حتى لو كان هذا يعني أننا نستغني عن عوائدها.

راحة المستخدم أهم عندنا. ❤️

واكتفينا بخدمات مميزة اختيارية داخل التطبيق، برسوم رمزية، للي يرغب فيها فقط. 💰👌

🌍 وخليجنا واحد ❤️

ولأننا نؤمن أن خليجنا واحد، قررنا أن يكون التطبيق لأهل مملكتنا الغالية 🇸🇦، ولإخواننا وحبايبنا في الكويت 🇰🇼 والبحرين 🇧🇭 والإمارات 🇦🇪 وقطر 🇶🇦 وعُمان 🇴🇲.

هدفنا مو بس بيع وشراء.

نبي نسهل على الناس الاستفادة من الأشياء اللي عندهم، ونقرّب بين اللي عنده شيء ما يحتاجه، واللي يحتاج هذا الشيء فعلًا. 🤝❤️

ونزيد من الترابط والمحبة بين أهل الخليج، والله لا يغيّر علينا، ويؤاخي بيننا ويديم علينا المحبة والخير. ❤️

🃏 وفي النهاية…

من جلسة بلوت بدأت السالفة…

واحد قال:
«مين يبي يشتري عفشي؟»

والرد كان:
«العب وانت ساكت.» 😂

وبعدها واحد سأل عن مشغل فيديوهات قديم 📼…

ومن هنا طلعت الفكرة.

العريس ما باع عفشه… لكنه كان سببًا في فكرة ممكن تساعدك تبيع عفشك أنت. 😂❤️

ومن بلوت… إلى تطبيق. 🃏📱
والباقي عليكم. 😉`;

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export default function About() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const { toast } = useToast();
  const nav = useNavigate();
  const { checkUserAuth } = useAuth();
  const [selected, setSelected] = useState(10);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const donate = async () => {
    const amt = custom ? parseFloat(custom) : selected;
    if (!amt || amt < 1) {
      toast({ title: ar ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createDonationLink", { amount: amt });
      if (res?.data?.ok && res.data.url) {
        window.open(res.data.url, "_blank");
        toast({ title: ar ? "تم فتح صفحة الدفع" : "Opening payment page" });
      } else {
        throw new Error(res?.data?.error || "Failed");
      }
    } catch (e) {
      const needLogin = e?.message?.includes("Unauthorized") || e?.message?.includes("401");
      if (needLogin) {
        toast({ title: ar ? "سجّل الدخول أولاً للتبرع" : "Please log in to donate" });
        base44.auth.redirectToLogin?.(window.location.pathname);
      } else {
        toast({ title: ar ? "تعذّر إنشاء رابط التبرع" : "Couldn't create donation link", description: e.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-3 pb-8 max-w-2xl mx-auto space-y-5">
      <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} className="rtl:rotate-180" /> {ar ? "رجوع" : "Back"}
      </button>

      {/* Story card */}
      <div className="rounded-3xl bg-card border border-border/60 p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold mb-4 text-center">من نحن</h1>
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap selectable" dir="rtl">
          {STORY}
        </div>
      </div>

      {/* Donation card */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Heart size={20} className="fill-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">ادعمنا 🌱</h2>
            <p className="text-xs opacity-90">ساهم في تطوير كاسر</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed opacity-95">
          عجبك كاسر؟ تبرعك يساعدنا نطوّر التطبيق ونقدّم الأفضل. 🌿
        </p>

        <div className="grid grid-cols-5 gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelected(amt); setCustom(""); }}
              className={`py-2.5 rounded-xl font-bold text-sm transition ${
                !custom && selected === amt
                  ? "bg-white text-emerald-700 shadow"
                  : "bg-white/15 hover:bg-white/25"
              }`}
            >
              {amt}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold opacity-90">مبلغ مخصص</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="مثال: 25"
              dir="ltr"
              inputMode="decimal"
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/15 placeholder-white/60 outline-none focus:ring-2 ring-white/40 text-sm font-semibold text-center"
            />
            <span className="text-sm font-bold opacity-90 shrink-0">ريال</span>
          </div>
        </div>

        <button
          onClick={donate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-emerald-700 font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-white/90 transition"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          تبرع الآن
        </button>
        <p className="text-[11px] text-center opacity-80">الدفع آمن عبر Moyasar · بطاقة أو Apple Pay</p>
      </div>
    </div>
  );
}