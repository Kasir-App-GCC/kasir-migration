import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Stores the user's REGA real estate license details on their profile and
// submits them for a single admin review. Once approved, the user can post
// Saudi real estate listings (the license is copied into each listing) with
// no per-listing review. Replaces the old per-listing license flow.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    // Only verified (trusted) users may submit a real estate license — the
    // trusted badge is a prerequisite for the REGA license review.
    if (!user.is_trusted) {
      return Response.json({ error: "Verify your account first" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const licenseType = (body.license_type || "").toString();
    const licenseNumber = (body.license_number || "").toString().trim();
    const licenseHolder = (body.license_holder || "").toString().trim();
    const licenseExpiry = (body.license_expiry || "").toString();
    const licenseDoc = (body.license_doc || "").toString().trim();
    const establishmentNumber = (body.establishment_number || "").toString().trim();

    const validTypes = ["individual_fal", "establishment_fal"];
    if (!validTypes.includes(licenseType)) {
      return Response.json({ error: "Invalid license type" }, { status: 400 });
    }
    // Establishment brokers must provide their unified establishment number;
    // individual brokers don't have one.
    if (licenseType === "establishment_fal" && !establishmentNumber) {
      return Response.json({ error: "Establishment number is required for establishment brokers" }, { status: 400 });
    }
    if (!licenseNumber || !licenseHolder || !licenseExpiry || !licenseDoc) {
      return Response.json({ error: "All license fields are required" }, { status: 400 });
    }
    // Basic expiry sanity: must be a valid date and not in the past.
    const exp = new Date(licenseExpiry);
    if (isNaN(exp.getTime())) {
      return Response.json({ error: "Invalid expiry date" }, { status: 400 });
    }
    if (exp.getTime() < Date.now()) {
      return Response.json({ error: "License has expired" }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(user.id, {
      re_license_type: licenseType,
      re_license_number: licenseNumber,
      re_license_holder: licenseHolder,
      re_license_expiry: licenseExpiry,
      re_license_doc: licenseDoc,
      re_establishment_number: licenseType === "establishment_fal" ? establishmentNumber : "",
      re_license_status: "pending",
      re_license_review_reason: "",
    });

    // Notify all admins that a license review is needed.
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" }, "-created_date", 500);
      const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.full_name || user.email || "";
      for (const admin of admins || []) {
        try {
          await base44.asServiceRole.entities.Notification.create({
            user_id: admin.id,
            type: "listing_pending_review",
            text: `طلب اعتماد ترخيص عقاري جديد من: ${userName}`,
            actor_name: userName,
          });
        } catch {}
      }
    } catch {}

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}