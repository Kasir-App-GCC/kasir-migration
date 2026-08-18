import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { useStore } from "@/lib/store";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
  const { lang } = useStore();
  const ar = lang === "ar";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[Contact] ${ar ? "رسالة من نموذج التواصل" : "Contact form message"}`);
    const body = encodeURIComponent(`${ar ? "الاسم" : "Name"}: ${name}\n${ar ? "البريد" : "Email"}: ${email}\n\n${message}`);
    window.location.href = `mailto:support@kasir-app.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <PublicLayout>
      <article>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          {ar ? "تواصل معنا" : "Contact Us"}
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed mb-6">
          {ar
            ? "نسعد بسماعك. راسلنا عبر البريد الإلكتروني أو املأ النموذج وسنعود إليك في أقرب وقت."
            : "We'd love to hear from you. Reach us by email or fill out the form below and we'll get back to you soon."}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <a
            href="mailto:support@kasir-app.com"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:border-border transition"
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{ar ? "البريد الإلكتروني" : "Email"}</p>
              <p className="text-sm font-bold" dir="ltr">support@kasir-app.com</p>
            </div>
          </a>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{ar ? "الدعم" : "Support"}</p>
              <p className="text-sm font-bold">{ar ? "متاح داخل التطبيق" : "Available in-app"}</p>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {ar ? "شكراً لك! تم فتح برنامج البريد لإرسال رسالتك." : "Thank you! Your email client should have opened to send your message."}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-5 rounded-2xl bg-card border border-border/60">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{ar ? "الاسم" : "Name"}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={ar ? "اسمك" : "Your name"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{ar ? "البريد الإلكتروني" : "Email"}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={80}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={ar ? "بريدك الإلكتروني" : "your@email.com"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{ar ? "الرسالة" : "Message"}</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder={ar ? "وش نقدر نساعدك فيه؟" : "How can we help?"}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition"
            >
              <Send size={16} />
              {ar ? "إرسال" : "Send message"}
            </button>
          </form>
        )}

        <div className="mt-8">
          <Link to="/about" className="text-sm font-semibold text-primary hover:underline">
            {ar ? "← تعرّف على كاسر" : "← Learn about Kasir"}
          </Link>
        </div>
      </article>
    </PublicLayout>
  );
}