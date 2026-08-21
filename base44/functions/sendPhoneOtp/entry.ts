import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Prelude (prelude.so) Notify v2 is used as the SMS transport: we generate a
// 6-digit code, hash it, persist the hash to the PhoneOtp entity, and ask
// Prelude to deliver the code over SMS using a pre-approved template that
// contains a {{code}} variable. Verification is done locally in
// verifyPhoneOtp by comparing the hash.
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

    const apiKey = secrets.get('PRELUDE_API_KEY');
    const templateId = secrets.get('PRELUDE_TEMPLATE_ID');
    if (!apiKey || !templateId) {
      return Response.json({ error: 'Prelude not configured' }, { status: 500 });
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

    const res = await fetch('https://api.prelude.dev/v2/notify', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        to: phone,
        preferred_channel: 'sms',
        variables: { code },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.code || ('HTTP ' + res.status);
      return Response.json({ error: 'Prelude error: ' + msg }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}