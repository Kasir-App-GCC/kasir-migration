import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Verifies the user-entered OTP against Telesign's verify endpoint using the
// reference_id stored by sendPhoneOtp (kept in the code_hash field).
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
    if (!pending) {
      return Response.json({ error: 'No pending code' }, { status: 400 });
    }
    if (new Date(pending.expires_at) < new Date()) {
      return Response.json({ error: 'Code expired' }, { status: 400 });
    }
    if ((pending.attempts || 0) >= MAX_ATTEMPTS) {
      return Response.json({ error: 'Too many attempts' }, { status: 400 });
    }

    const customerId = secrets.get('TELESIGN_CUSTOMER_ID');
    const apiKey = secrets.get('TELESIGN_API_KEY');
    if (!customerId || !apiKey) {
      return Response.json({ error: 'Telesign not configured' }, { status: 500 });
    }

    await base44.entities.PhoneOtp.update(pending.id, { attempts: (pending.attempts || 0) + 1 });

    const form = new URLSearchParams();
    form.append('verify_code', code);

    const res = await fetch(`https://rest-ww.telesign.com/v1/verify/${pending.code_hash}`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${customerId}:${apiKey}`),
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.errors?.[0]?.description || data?.errors?.[0]?.code || data?.message || ('HTTP ' + res.status);
      return Response.json({ error: 'Telesign error: ' + msg }, { status: 502 });
    }

    if (data?.verify_state === 'valid') {
      await base44.entities.PhoneOtp.update(pending.id, { verified: true });
      return Response.json({ ok: true, verified: true });
    }
    return Response.json({ error: 'Invalid code' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}