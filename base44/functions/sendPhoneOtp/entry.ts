import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Authentica.sa hosted OTP: it generates the code, delivers it over SMS, and
// verifies it later by phone + code. We persist a PhoneOtp record only to
// track expiry / attempts; verification is delegated to Authentica.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let phone = (body?.phone || '').trim();
    if (!phone) return Response.json({ error: 'Phone is required' }, { status: 400 });
    if (!phone.startsWith('+')) phone = '+' + phone;
    if (!/^\+\d{8,15}$/.test(phone)) {
      return Response.json({ error: 'Invalid phone. Use E.164 format e.g. +9665XXXXXXXX' }, { status: 400 });
    }

    const channel = ['whatsapp', 'voice', 'email'].includes(body?.channel) ? body.channel : 'sms';

    const apiKey = secrets.get('AUTHENTICA_API_KEY');
    if (!apiKey) return Response.json({ error: 'Authentica not configured' }, { status: 500 });

    const res = await fetch('https://api.authentica.sa/api/v2/send-otp', {
      method: 'POST',
      headers: {
        'X-Authorization': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: channel,
        phone,
        template_id: 31,
      }),
    });

    const data = await res.json().catch(() => ({}));
    const ok = res.ok && (data?.success === true || data?.status === true || data?.verified === true);
    if (!ok) {
      const msg = data?.message || data?.errors?.[0]?.message || ('HTTP ' + res.status);
      return Response.json({ error: 'Authentica error: ' + msg }, { status: 502 });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await base44.entities.PhoneOtp.create({
      phone,
      code_hash: 'authentica', // marker — Authentica verifies by phone, not reference
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