import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { REPORT_REASONS } from "@/lib/constants";
import RatingStars from "./RatingStars";

export default function ReportDialog({ open, onClose, seller, item }) {
  const { user } = useStore();
  const { lang } = useStore();
  const t = useT();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await base44.entities.Report.create({
        reported_user_id: seller?.id,
        reported_user_name: seller?.name,
        reporter_user_id: user?.id,
        reason,
        details,
        item_id: item?.id,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setReason(null);
    setDetails("");
    setDone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-[100%] duration-300">
        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-4">
              <Flag size={26} />
            </div>
            <p className="font-bold text-lg mb-1">{t("reportSubmitted")}</p>
            <button onClick={close} className="mt-5 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">
              {t("cancel")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">{t("reportSeller")}</h3>
              <button onClick={close} className="p-1.5 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <p className="text-sm text-muted-foreground mb-3">{t("reportReason")}</p>
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition text-start ${
                    reason === r.id ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30" : "hover:bg-muted"
                  }`}
                >
                  <span>{lang === "ar" ? r.ar : r.en}</span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      reason === r.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("reportDetailsPlaceholder")}
                rows={3}
                className="mt-3 w-full px-3.5 py-3 rounded-xl bg-muted text-sm outline-none focus:ring-2 ring-primary/30 resize-none"
              />
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={close} className="px-4 py-3 rounded-xl text-sm font-semibold bg-muted text-muted-foreground">
                {t("cancel")}
              </button>
              <button
                onClick={submit}
                disabled={!reason || submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {t("submitReport")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}