import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Verifies the user-entered OTP against MSG91's verify endpoint by mobile + code.
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

    const authkey = secrets.get('MSG91_AUTH_KEY');
    if (!authkey) return Response.json({ error: 'MSG91 not configured' }, { status: 500 });

    await base44.entities.PhoneOtp.update(pending.id, { attempts: (pending.attempts || 0) + 1 });

    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;
    const url = `https://api.msg91.com/api/v5/otp/verify?authkey=${encodeURIComponent(authkey)}&mobile=${encodeURIComponent(mobile)}&otp=${encodeURIComponent(code)}`;
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json().catch(() => ({}));

    if (data?.type === 'success' || data?.message === 'OTP verified' || data?.message?.toLowerCase().includes('verified')) {
      await base44.entities.PhoneOtp.update(pending.id, { verified: true });
      return Response.json({ ok: true, verified: true });
    }
    const msg = data?.message || ('HTTP ' + res.status);
    return Response.json({ error: 'Invalid code: ' + msg }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}