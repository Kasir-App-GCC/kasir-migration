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

    const amountHalalas = VERIFICATION_FEE * 100;
    const authHeader = 'Basic ' + btoa(secretKey + ':');

    // Create the Moyasar hosted invoice for the one-time verification fee.
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
        callback_url: 'https://kasir-ksa.base44.app/profile?verify_payment=1',
        success_url: 'https://kasir-ksa.base44.app/profile?verify_payment=1',
        back_url: 'https://kasir-ksa.base44.app/profile',
        metadata: {
          type: 'verification',
          user_id: user.id,
          full_name: input.fullName,
          phone: input.phone,
          national_id: input.nationalId,
        },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    // Mark the phone as verified on the user profile so it persists across
    // payment retries (the user won't need to re-verify if the payment fails).
    try {
      await base44.asServiceRole.entities.User.update(user.id, { phone_verified: true });
    } catch (e) {}

    return Response.json({
      ok: true,
      invoiceId: data.id,
      url: data.url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}