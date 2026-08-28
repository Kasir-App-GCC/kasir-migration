import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { parseVerificationInput, validateVerificationInput } from '../../shared/verificationValidation.ts';

const VERIFICATION_FEE = 12; // SAR

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const input = parseVerificationInput(body);
    const validationError = validateVerificationInput(input, user);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // Block already-verified users from paying again.
    if (user.is_trusted) {
      return Response.json({ error: 'Your account is already verified' }, { status: 409 });
    }

    // Clean up any old pending requests from previous attempts so the user can
    // retry freely (these no longer block the dialog or appear in admin review).
    try {
      await base44.asServiceRole.entities.VerificationRequest.updateMany(
        { user_id: user.id, status: 'pending' },
        { $set: { status: 'rejected', reviewed_by: 'system_stale' } }
      );
    } catch (e) {}

    const secretKey = secrets.get('MOYASAR_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'MOYASAR_SECRET_KEY not set' }, { status: 500 });

    // Persist the verification details (incl. national_id) in a pending
    // VerificationRequest BEFORE creating the invoice, so the national ID never
    // leaves our system to Moyasar — only the request id is passed as metadata.
    let pending;
    try {
      pending = await base44.asServiceRole.entities.VerificationRequest.create({
        user_id: user.id,
        user_name: user.name || input.fullName,
        user_email: user.email,
        full_name: input.fullName,
        phone: input.phone,
        national_id: input.nationalId,
        status: 'pending',
        payment_receipt_url: 'moyasar:pending',
      });
    } catch (e) {
      return Response.json({ error: 'Could not start verification' }, { status: 500 });
    }

    const amountHalalas = VERIFICATION_FEE * 100;
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    // Use the origin the request came from so Moyasar redirects back to the
    // domain the user is actually browsing (custom domain or base44 fallback).
    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');

    // Create the Moyasar hosted invoice. national_id is intentionally OMITTED
    // from the metadata — it's sensitive PII and stays only in our DB.
    const moyasarRes = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        description: 'رسوم توثيق الحساب - كاسر',
        // callback_url is a SERVER webhook: Moyasar POSTs the paid invoice here
        // so the badge is granted even if the user closes the popup before the
        // client confirm lands.
        callback_url: `${origin}/functions/confirmVerificationPayment`,
        // success_url returns the user to the profile after paying on mobile
        // (where the popup may be blocked and Moyasar redirects instead). The
        // `vrid` is our local verification request id so the client can confirm
        // even if Moyasar appends no id of its own to the redirect URL.
        success_url: `${origin}/profile?verify_payment=1&vrid=${pending.id}`,
        back_url: `${origin}/profile`,
        metadata: {
          type: 'verification',
          user_id: user.id,
          verification_request_id: pending.id,
          full_name: input.fullName,
          phone: input.phone,
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      // Roll back the pending request so a failed invoice doesn't linger.
      try { await base44.asServiceRole.entities.VerificationRequest.update(pending.id, { status: 'rejected', reviewed_by: 'system_invoice_failed' }); } catch (e) {}
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    // Stamp the invoice id on the pending request for traceability.
    try { await base44.asServiceRole.entities.VerificationRequest.update(pending.id, { payment_receipt_url: 'moyasar:' + data.id }); } catch (e) {}

    // Mark the phone as verified on the user profile so it persists across
    // payment retries (the user won't need to re-verify if the payment fails).
    try {
      await base44.asServiceRole.entities.User.update(user.id, { phone_verified: true });
    } catch (e) {}

    return Response.json({
      ok: true,
      requestId: pending.id,
      invoiceId: data.id,
      url: data.url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}