import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { parseVerificationInput, validateVerificationInput, hasPendingVerification } from '../../shared/verificationValidation.ts';

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

    // Block duplicate pending requests — a user cannot submit another while one is in flight.
    if (await hasPendingVerification(base44, user.id)) {
      return Response.json({ error: 'You already have a pending verification request' }, { status: 409 });
    }

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
        metadata: { type: 'verification', user_id: user.id },
      }),
    });

    const data = await moyasarRes.json();
    if (!moyasarRes.ok) {
      return Response.json({
        error: data?.message || data?.errors || `Moyasar error (${moyasarRes.status})`,
      });
    }

    // Create the verification request tagged with the Moyasar invoice ID so the
    // confirmation step can match it back after the user pays.
    const request = await base44.entities.VerificationRequest.create({
      user_id: user.id,
      user_name: user.name || input.fullName,
      user_email: user.email,
      full_name: input.fullName,
      phone: input.phone,
      national_id: input.nationalId,
      status: 'pending',
      payment_receipt_url: 'moyasar:' + data.id,
    });

    // Mark the phone as verified on the user profile so it persists.
    try {
      await base44.asServiceRole.entities.User.update(user.id, { phone_verified: true });
    } catch (e) {}

    return Response.json({
      ok: true,
      requestId: request.id,
      invoiceId: data.id,
      url: data.url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}