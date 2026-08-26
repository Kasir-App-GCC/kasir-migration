import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";

// Pending admin work items (reports, support tickets, verification & boost
// requests). Surfaced in the admin's notification bell + panel, each
// clickable straight to the relevant admin board tab. Non-admins get nothing.
export default function useAdminPending() {
  const { user, lang } = useStore();
  const ar = lang === "ar";
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isAdmin) { setItems([]); return; }
    let cancelled = false;
    let timer = null;

    const load = async () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const [tickets, reports, verifications, boosts, disputes] = await Promise.allSettled([
            base44.entities.SupportTicket.filter({ status: "open" }, "-created_date", 50),
            base44.entities.Report.list("-created_date", 50),
            base44.entities.VerificationRequest.filter({ status: "pending" }, "-created_date", 50),
            base44.entities.BoostRequest.filter({ status: "pending" }, "-created_date", 50),
            base44.entities.Dispute.filter({ status: "open" }, "-created_date", 50),
          ]);
          if (cancelled) return;
          const tItems = (tickets.value || []).map((x) => ({
            id: `ticket-${x.id}`, type: "admin_ticket", adminTab: "tickets", unread: true,
            name: x.subject || (ar ? "تذكرة دعم" : "Support ticket"),
            text: x.message || "", date: x.created_date,
          }));
          const rItems = (reports.value || []).filter((r) => !r.resolved).map((x) => ({
            id: `report-${x.id}`, type: "admin_report", adminTab: "reports", unread: true,
            name: x.reported_user_name || (ar ? "بلاغ مستخدم" : "User report"),
            text: x.reason || "", date: x.created_date,
          }));
          const vItems = (verifications.value || [])
            .filter((x) => !(x.payment_receipt_url || "").startsWith("moyasar:"))
            .map((x) => ({
              id: `verify-${x.id}`, type: "admin_verification", adminTab: "verifications", unread: true,
              name: x.full_name || x.user_name || (ar ? "طلب توثيق" : "Verification request"),
              text: ar ? "طلب توثيق بانتظار المراجعة" : "Verification pending review", date: x.created_date,
            }));
          const bItems = (boosts.value || []).map((x) => ({
            id: `boost-${x.id}`, type: "admin_boost", adminTab: "boosts", unread: true,
            name: x.item_title || (ar ? "طلب تعزيز" : "Boost request"),
            text: ar ? `تعزيز ${x.hours} ساعة` : `Boost ${x.hours}h`, date: x.created_date,
          }));
          const dItems = (disputes.value || []).map((x) => ({
            id: `dispute-${x.id}`, type: "admin_dispute", adminTab: "disputes", unread: true,
            name: x.item_title || (ar ? "نزاع جديد" : "New dispute"),
            text: ar ? `من ${x.complainant_name || ""} ضد ${x.respondent_name || ""}` : `${x.complainant_name || ""} vs ${x.respondent_name || ""}`,
            date: x.created_date,
          }));
          setItems(
            [...tItems, ...rItems, ...vItems, ...bItems, ...dItems].sort(
              (a, b) => new Date(b.date) - new Date(a.date)
            )
          );
        } catch {}
      }, 200);
    };

    load();
    const subs = [
      base44.entities.SupportTicket.subscribe(load),
      base44.entities.Report.subscribe(load),
      base44.entities.VerificationRequest.subscribe(load),
      base44.entities.BoostRequest.subscribe(load),
      base44.entities.Dispute.subscribe(load),
    ];
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subs.forEach((u) => u && u());
    };
  }, [isAdmin, lang]);

  return { items, count: items.length };
}