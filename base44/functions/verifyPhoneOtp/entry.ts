import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Verifies an OTP locally against the hashed code stored by sendPhoneOtp
// (sms.to Verify API uses client-generated OTPs, so no provider call is needed).
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

    // Find the latest pending OTP for this user + phone.
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

    // Bump attempts before checking so brute-force attempts are throttled
    // regardless of whether this guess matches.
    await base44.entities.PhoneOtp.update(pending.id, { attempts: (pending.attempts || 0) + 1 });

    const hash = await sha256Hex(code + phone);
    if (hash === pending.code_hash) {
      await base44.entities.PhoneOtp.update(pending.id, { verified: true });
      return Response.json({ ok: true, verified: true });
    }
    return Response.json({ error: 'Invalid code' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}