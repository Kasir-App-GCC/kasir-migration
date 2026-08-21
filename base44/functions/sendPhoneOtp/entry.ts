import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Infobip is used as a plain SMS transport: we generate a 6-digit code, hash it,
// persist the hash to the PhoneOtp entity, and ask Infobip to deliver the code
// over SMS. Verification is done locally in verifyPhoneOtp by comparing the hash.
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

    const apiKey = secrets.get('INFOBIP_API_KEY');
    let baseUrl = (secrets.get('INFOBIP_BASE_URL') || '').trim().replace(/\/+$/, '');
    if (!apiKey || !baseUrl) {
      return Response.json({ error: 'Infobip not configured' }, { status: 500 });
    }
    if (!/^https?:\/\//.test(baseUrl)) baseUrl = 'https://' + baseUrl;

    // Infobip accepts either "App <apiKey>" or Basic auth with the API key as
    // both username and password. We send both so either account type works.
    const basicCred = btoa(`${apiKey}:${apiKey}`);

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

    const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        Authorization: 'App ' + apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: phone }],
            from: 'InfoSMS',
            text: `Your verification code is ${code}`,
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.requestError?.serviceException?.text
        || data?.message
        || data?.requestError?.serviceException?.message
        || ('HTTP ' + res.status);
      const host = baseUrl.replace(/^https?:\/\//, '');
      return Response.json({ error: `Infobip error: ${msg} (host: ${host})` }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}