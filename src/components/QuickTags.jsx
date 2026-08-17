import React from "react";
import { Tag } from "lucide-react";

const SEP = " · ";

const GENERAL_GROUPS = [
  {
    id: "price",
    label: { en: "Price", ar: "السعر" },
    options: [
      { en: "Firm price", ar: "السعر ثابت" },
      { en: "Slightly negotiable", ar: "قابل للتفاوض البسيط" },
      { en: "Negotiable", ar: "قابل للتفاوض" },
    ],
  },
  {
    id: "delivery",
    label: { en: "Delivery", ar: "التوصيل" },
    options: [
      { en: "Pickup only", ar: "استلام فقط" },
      { en: "Local delivery", ar: "توصيل داخل المدينة" },
      { en: "Shipping available", ar: "شحن متاح" },
    ],
  },
  {
    id: "extras",
    label: { en: "Extras", ar: "إضافات" },
    options: [
      { en: "Original packaging", ar: "التغليف الأصلي" },
      { en: "Warranty included", ar: "ضمان متضمن" },
      { en: "Receipt available", ar: "فاتورة متوفرة" },
      { en: "Barely used", ar: "بالكاد مستخدم" },
      { en: "Gift wrapping", ar: "تغليف هدية" },
    ],
  },
];

const CATEGORY_GROUPS = {
  electronics: [
    {
      id: "device",
      label: { en: "Device", ar: "الجهاز" },
      options: [
        { en: "No scratches", ar: "بلا خدوش" },
        { en: "Screen protector applied", ar: "حامي شاشة مركب" },
        { en: "Battery health excellent", ar: "بطارية ممتازة" },
        { en: "Original box included", ar: "العلبة الأصلية متوفرة" },
        { en: "Account signed out", ar: "تم تسجيل الخروج" },
      ],
    },
  ],
  cars: [
    {
      id: "specs",
      label: { en: "Specs", ar: "المواصفات" },
      options: [
        { en: "GCC specs", ar: "مواصفات خليجية" },
        { en: "Full service history", ar: "سجل صيانة كامل" },
        { en: "Low mileage", ar: "ممشى قليل" },
        { en: "No accidents", ar: "بلا حوادث" },
        { en: "Comprehensive insurance", ar: "تأمين شامل" },
      ],
    },
  ],
  furniture: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "Smoke-free home", ar: "بيت خالٍ من التدخين" },
        { en: "Pet-free home", ar: "خالٍ من الحيوانات" },
        { en: "Easy to assemble", ar: "سهل التركيب" },
        { en: "Disassembled for transport", ar: "مفكك للنقل" },
      ],
    },
  ],
  fashion: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "Never worn", ar: "بالكاد لبست" },
        { en: "Original tags on", ar: "التكت الأصلي" },
        { en: "Authentic with proof", ar: "أصلي مع إثبات" },
        { en: "Smoke-free", ar: "خالٍ من التدخين" },
      ],
    },
  ],
  realestate: [
    {
      id: "property",
      label: { en: "Property", ar: "العقار" },
      options: [
        { en: "Furnished", ar: "مفروش" },
        { en: "Unfurnished", ar: "غير مفروش" },
        { en: "Parking available", ar: "مواقف متوفرة" },
        { en: "Utilities included", ar: "الخدمات شاملة" },
        { en: "Family friendly", ar: "للعوائل" },
      ],
    },
  ],
  services: [
    {
      id: "service",
      label: { en: "Service", ar: "الخدمة" },
      options: [
        { en: "At your location", ar: "في موقعك" },
        { en: "Same-day service", ar: "خدمة بنفس اليوم" },
        { en: "Licensed", ar: "مرخّص" },
        { en: "Materials included", ar: "الخامات شاملة" },
      ],
    },
  ],
  toys: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "All pieces included", ar: "كل القطع متوفرة" },
        { en: "Working condition", ar: "يعمل" },
        { en: "Age range on box", ar: "العمر مكتوب" },
      ],
    },
  ],
  sports: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "Barely used", ar: "بالكاد مستخدم" },
        { en: "All parts included", ar: "كل القطع متوفرة" },
        { en: "Adjustable", ar: "قابل للتعديل" },
      ],
    },
  ],
  books: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "Like new", ar: "كالجديد" },
        { en: "No highlights", ar: "بلا تظليل" },
        { en: "Original edition", ar: "الإصدار الأصلي" },
      ],
    },
  ],
  animals: [
    {
      id: "pet",
      label: { en: "Pet", ar: "الحيوان" },
      options: [
        { en: "Vaccinated", ar: "مطعّم" },
        { en: "Trained", ar: "مدرّب" },
        { en: "With health record", ar: "مع سجل صحي" },
      ],
    },
  ],
  jobs: [
    {
      id: "job",
      label: { en: "Job", ar: "الوظيفة" },
      options: [
        { en: "Remote", ar: "عن بُعد" },
        { en: "Visa provided", ar: "تأشيرة متوفرة" },
        { en: "Immediate start", ar: "بداية فورية" },
      ],
    },
  ],
  education: [
    {
      id: "course",
      label: { en: "Course", ar: "الدورة" },
      options: [
        { en: "Certificate provided", ar: "شهادة معتمدة" },
        { en: "Online", ar: "أونلاين" },
        { en: "Flexible schedule", ar: "مواعيد مرنة" },
      ],
    },
  ],
  occasions: [
    {
      id: "service",
      label: { en: "Service", ar: "الخدمة" },
      options: [
        { en: "Booked in advance", ar: "حجز مسبق" },
        { en: "Customizable", ar: "حسب الطلب" },
        { en: "Tasting available", ar: "تذوّق متاح" },
      ],
    },
  ],
  antiques: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "Authenticated", ar: "موثّق" },
        { en: "Rare", ar: "نادر" },
        { en: "With certificate", ar: "مع شهادة" },
      ],
    },
  ],
  arts: [
    {
      id: "item",
      label: { en: "Item", ar: "القطعة" },
      options: [
        { en: "Original", ar: "أصلي" },
        { en: "Signed by artist", ar: "موقّع من الفنان" },
        { en: "Framed", ar: "مؤطّر" },
      ],
    },
  ],
  families: [
    {
      id: "product",
      label: { en: "Product", ar: "المنتج" },
      options: [
        { en: "Homemade fresh", ar: "طازج منزلي" },
        { en: "Custom orders", ar: "طلبات حسب الطلب" },
        { en: "Delivery available", ar: "توصيل متاح" },
      ],
    },
  ],
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTag(description, label) {
  return (
    description === label ||
    description.startsWith(label + SEP) ||
    description.endsWith(SEP + label) ||
    description.includes(SEP + label + SEP)
  );
}

function toggleTag(description, label) {
  if (hasTag(description, label)) {
    if (description === label) return "";
    if (description.startsWith(label + SEP)) return description.slice(label.length + SEP.length);
    if (description.endsWith(SEP + label)) return description.slice(0, -label.length - SEP.length);
    return description.replace(new RegExp(escapeRegExp(SEP + label + SEP)), SEP);
  }
  if (!description.trim()) return label;
  return description + SEP + label;
}

export default function QuickTags({ category, lang, description, setDescription }) {
  const ar = lang === "ar";
  const groups = [...GENERAL_GROUPS, ...(CATEGORY_GROUPS[category] || [])];

  return (
    <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Tag size={13} /> {ar ? "وسوم سريعة (تُضاف للوصف)" : "Quick tags (added to description)"}
      </div>
      {groups.map((g) => (
        <div key={g.id}>
          <p className="text-[11px] font-bold mb-1.5">{ar ? g.label.ar : g.label.en}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.options.map((o) => {
              const label = ar ? o.ar : o.en;
              const active = hasTag(description, label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDescription(toggleTag(description, label).slice(0, 300))}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-card border-border/70 hover:bg-muted"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}