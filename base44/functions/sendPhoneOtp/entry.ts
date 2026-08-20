import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

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

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(code + ':' + phone));
    const codeHash = [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await base44.entities.PhoneOtp.create({
      phone,
      code_hash: codeHash,
      user_id: user.id,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
    });

    const sid = secrets.get('TWILIO_ACCOUNT_SID');
    const token = secrets.get('TWILIO_AUTH_TOKEN');
    const from = secrets.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const authHeader = 'Basic ' + btoa(`${sid}:${token}`);
    const params = new URLSearchParams();
    params.append('To', phone);
    params.append('From', from);
    params.append('Body', `Your verification code is ${code}`);

    const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const twData = await twRes.json().catch(() => ({}));
    if (!twRes.ok) {
      return Response.json({ error: 'Twilio error: ' + (twData.message || twRes.status) }, { status: 502 });
    }

    return Response.json({ ok: true, sid: twData.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}