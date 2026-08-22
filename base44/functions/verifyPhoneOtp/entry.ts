import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Verifies the user-entered OTP against Authentica's verify endpoint by phone + code.
const MAX_ATTEMPTS = 5;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const phone = (body?.phone || '').trim();
    const code = (body?.code || '').trim();
    if (!phone || !code) {
      return Response.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const records = await base44.entities.PhoneOtp.filter(
      { user_id: user.id, phone },
      '-created_date',
      10
    );
    const pending = (records || []).find((r) => !r.verified);
    if (!pending) return Response.json({ error: 'No pending code' }, { status: 400 });
    if (new Date(pending.expires_at) < new Date()) {
      return Response.json({ error: 'Code expired' }, { status: 400 });
    }
    if ((pending.attempts || 0) >= MAX_ATTEMPTS) {
      return Response.json({ error: 'Too many attempts' }, { status: 400 });
    }

    const apiKey = secrets.get('AUTHENTICA_API_KEY');
    if (!apiKey) return Response.json({ error: 'Authentica not configured' }, { status: 500 });

    await base44.entities.PhoneOtp.update(pending.id, { attempts: (pending.attempts || 0) + 1 });

    const res = await fetch('https://api.authentica.sa/api/v2/verify-otp', {
      method: 'POST',
      headers: {
        'X-Authorization': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp: code }),
    });

    const data = await res.json().catch(() => ({}));
    if (data?.verified === true || data?.success === true) {
      await base44.entities.PhoneOtp.update(pending.id, { verified: true });
      return Response.json({ ok: true, verified: true });
    }
    const msg = data?.message || data?.errors?.[0]?.message || ('HTTP ' + res.status);
    return Response.json({ error: 'Invalid code: ' + msg }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}