import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

    const records = await base44.entities.PhoneOtp.filter({ phone, user_id: user.id }, '-created_date', 5);
    const latest = records?.[0];
    if (!latest) return Response.json({ error: 'No code sent. Request a new code.' }, { status: 404 });
    if (latest.verified) return Response.json({ error: 'Already verified' }, { status: 400 });
    if (new Date(latest.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'Code expired. Request a new code.' }, { status: 410 });
    }
    if ((latest.attempts || 0) >= 5) {
      return Response.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
    }

    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(code + ':' + phone));
    const codeHash = [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');

    if (codeHash !== latest.code_hash) {
      await base44.entities.PhoneOtp.update(latest.id, { attempts: (latest.attempts || 0) + 1 });
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    await base44.entities.PhoneOtp.update(latest.id, { verified: true });
    return Response.json({ ok: true, verified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}