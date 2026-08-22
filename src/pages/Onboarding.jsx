import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";
import { base44 } from "@/api/base44Client";

// One-time interest picker shown after profile setup. Choices are persisted
// on the user profile and used to surface matching categories first on Home.
export default function Onboarding() {
  const { checkUserAuth } = useAuth();
  const { lang } = useStore();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [picks, setPicks] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = async (skip) => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ interests: skip ? [] : picks });
      localStorage.setItem("souqi_onboarded", "1");
      await checkUserAuth();
      nav("/");
    } catch {
      setSaving(false);
    }
  };

  const cats = CATEGORIES.filter((c) => c.id !== "all" && c.id !== "other");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold">{ar ? "ما يهمّك؟" : "What are you into?"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "اختر اهتماماتك ونخصّص لك المتجر" : "Pick your interests to personalize your feed"}</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {cats.map((c) => {
            const active = picks.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}
              >
                <c.icon size={22} />
                <span className="text-xs font-semibold text-center leading-tight">{ar ? c.ar : c.en}</span>
                {active && <Check size={14} className="absolute top-1.5 end-1.5" />}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={() => finish(true)} disabled={saving} className="flex-1 py-3.5 rounded-2xl bg-muted font-bold">
            {ar ? "تخطٍّ" : "Skip"}
          </button>
          <button onClick={() => finish(false)} disabled={saving || picks.length === 0} className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {ar ? "تابع" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}