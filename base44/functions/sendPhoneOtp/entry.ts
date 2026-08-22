import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Telesign Verify (hosted OTP): we POST the phone number to Telesign, which
// generates and delivers the code over SMS and returns a reference_id. We
// persist that reference_id on the PhoneOtp record so verifyPhoneOtp can
// check the user-entered code against Telesign's verify endpoint.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let phone = (body?.phone || '').trim();
    if (!phone) return Response.json({ error: 'Phone is required' }, { status: 400 });
    // Telesign expects the number without the leading "+".
    if (phone.startsWith('+')) phone = phone.slice(1);
    if (!/^\d{8,15}$/.test(phone)) {
      return Response.json({ error: 'Invalid phone. Use E.164 format e.g. +9665XXXXXXXX' }, { status: 400 });
    }

    const customerId = secrets.get('TELESIGN_CUSTOMER_ID');
    const apiKey = secrets.get('TELESIGN_API_KEY');
    if (!customerId || !apiKey) {
      return Response.json({ error: 'Telesign not configured' }, { status: 500 });
    }

    const form = new URLSearchParams();
    form.append('phone_number', phone);

    const res = await fetch('https://rest-ww.telesign.com/v1/verify/sms', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${customerId}:${apiKey}`),
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.reference_id) {
      const msg = data?.errors?.[0]?.description || data?.errors?.[0]?.code || data?.message || ('HTTP ' + res.status);
      return Response.json({ error: 'Telesign error: ' + msg }, { status: 502 });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await base44.entities.PhoneOtp.create({
      phone: '+' + phone,
      code_hash: data.reference_id, // reused to hold the Telesign reference_id
      user_id: user.id,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}