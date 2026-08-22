import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// MSG91 hosted OTP: MSG91 generates the code, delivers it over SMS, and
// verifies it later by mobile + code. We only persist a PhoneOtp record to
// track expiry / attempts; verification itself is delegated to MSG91.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let phone = (body?.phone || '').trim();
    if (!phone) return Response.json({ error: 'Phone is required' }, { status: 400 });
    if (phone.startsWith('+')) phone = phone.slice(1);
    if (!/^\d{8,15}$/.test(phone)) {
      return Response.json({ error: 'Invalid phone. Use E.164 format e.g. +9665XXXXXXXX' }, { status: 400 });
    }

    const authkey = secrets.get('MSG91_AUTH_KEY');
    if (!authkey) return Response.json({ error: 'MSG91 not configured' }, { status: 500 });

    const res = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        authkey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        mobile: phone,
        message: 'Your Zavu verification code is ##OTP##. It expires in 5 minutes.',
        otp_length: 6,
        otp_expiry: 5,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.type !== 'success') {
      const msg = data?.message || ('HTTP ' + res.status);
      return Response.json({ error: 'MSG91 error: ' + msg }, { status: 502 });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await base44.entities.PhoneOtp.create({
      phone: '+' + phone,
      code_hash: 'msg91', // marker — MSG91 verifies by mobile, not reference
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