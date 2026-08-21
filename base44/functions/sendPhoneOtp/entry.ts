import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// sms.to Verify API uses client-generated OTPs: we generate the code, hash it,
// persist it to the PhoneOtp entity, and ask sms.to to deliver it. Verification
// is then done locally in verifyPhoneOtp by comparing the hash.
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

    const apiKey = secrets.get('SMSTO_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'sms.to API key not configured' }, { status: 500 });
    }

    // Generate a 6-digit code and persist its hash so verifyPhoneOtp can check
    // it locally without a second round-trip to the provider.
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const code = String(arr[0] % 1000000).padStart(6, '0');
    const codeHash = await sha256Hex(code + phone);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await base44.entities.PhoneOtp.create({
      phone,
      code_hash: codeHash,
      user_id: user.id,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
    });

    // Map the requested delivery channel to sms.to's channel names. Default to
    // WhatsApp (priority 1) since SMS delivery was unreliable with the previous
    // provider; fall back to a voice call if whatsapp isn't requested.
    const requested = (body?.channel || 'whatsapp').trim();
    const channel = requested === 'sms' ? 'sms' : requested === 'call' ? 'voice' : 'whatsapp';

    const res = await fetch('https://verifyapi.sms.to/api/v1/verifications/create', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guid: crypto.randomUUID(),
        recipient: phone,
        code,
        channels: [{ channel, sender_id: "SMSTO", priority: 1, expiry_time: 300 }],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || ('HTTP ' + res.status);
      return Response.json({ error: 'sms.to error: ' + msg }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}