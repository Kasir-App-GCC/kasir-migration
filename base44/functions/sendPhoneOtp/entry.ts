import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Twilio Verify API — voice ("call") channel. Twilio generates and owns the
// OTP code; we only initiate the verification here and let verifyPhoneOtp
// check it via Twilio's VerificationCheck endpoint. A PhoneOtp record is kept
// for audit and per-user rate limiting.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const phone = (body?.phone || '').trim();
    if (!/^\+\d{8,15}$/.test(phone)) {
      return Response.json({ error: 'Invalid phone. Use E.164 format e.g. +9665XXXXXXXX' }, { status: 400 });
    }

    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    const serviceSid = secrets.get('TWILIO_VERIFY_SERVICE_SID');
    if (!accountSid || !authToken || !serviceSid) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Always use the voice ("call") channel for delivery reliability.
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Channel: 'call' }).toString(),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || ('HTTP ' + res.status);
      return Response.json({ error: 'Twilio error: ' + msg }, { status: 502 });
    }

    // Persist a record for audit + rate limiting. Twilio owns the code, so the
    // hash field is just a marker.
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await base44.entities.PhoneOtp.create({
      phone,
      code_hash: 'twilio-managed',
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