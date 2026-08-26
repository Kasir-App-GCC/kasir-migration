import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { parseVerificationInput, validateVerificationInput } from '../../shared/verificationValidation.ts';
import { createMoyasarInvoice } from '../../shared/moyasarInvoice.ts';

const VERIFICATION_FEE = 12; // SAR

// Creates a pending VerificationRequest (holding the sensitive national_id
// server-side), marks the phone verified, then creates a Moyasar invoice and
// returns the hosted checkout URL. The client redirects there; after payment,
// Moyasar redirects back to /profile?verify_payment=1&id=<payment_id>, where
// confirmVerificationPayment verifies the payment and grants the trusted badge.
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

    // Clean up any old pending requests from previous attempts so the user
    // can retry freely.
    try {
      await base44.asServiceRole.entities.VerificationRequest.updateMany(
        { user_id: user.id, status: 'pending' },
        { $set: { status: 'rejected', reviewed_by: 'system_stale' } }
      );
    } catch (e) {}

    // Persist the verification details (incl. national_id) in a pending
    // VerificationRequest BEFORE the payment. The national_id never leaves our
    // system to Moyasar — only the request id is passed as invoice metadata.
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

    // Mark the phone as verified on the user profile so it persists across
    // payment retries (the user won't need to re-verify if the payment fails).
    try {
      await base44.asServiceRole.entities.User.update(user.id, { phone_verified: true });
    } catch (e) {}

    const origin = (body?.origin || 'https://kasir-ksa.base44.app').replace(/\/$/, '');
    const { url } = await createMoyasarInvoice({
      amountSar: VERIFICATION_FEE,
      description: 'رسوم توثيق الحساب - كاسر',
      callbackUrl: `${origin}/profile?verify_payment=1`,
      metadata: {
        type: 'verification',
        user_id: String(user.id),
        verification_request_id: String(pending.id),
      },
    });

    return Response.json({
      ok: true,
      requestId: pending.id,
      amount: VERIFICATION_FEE,
      url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}