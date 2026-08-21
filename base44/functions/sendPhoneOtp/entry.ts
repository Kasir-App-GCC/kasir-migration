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

    const sid = secrets.get('TWILIO_ACCOUNT_SID');
    const token = secrets.get('TWILIO_AUTH_TOKEN');
    const serviceSid = secrets.get('TWILIO_VERIFY_SERVICE_SID');
    if (!sid || !token || !serviceSid) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const authHeader = 'Basic ' + btoa(`${sid}:${token}`);
    const channel = (body?.channel || 'call').trim();
    const params = new URLSearchParams();
    params.append('To', phone);
    params.append('Channel', channel);

    const twRes = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const twData = await twRes.json().catch(() => ({}));
    if (!twRes.ok) {
      const code = twData.code ? ` [${twData.code}]` : '';
      const more = twData.more_info ? ` (${twData.more_info})` : '';
      return Response.json({ error: 'Twilio error: ' + (twData.message || twRes.status) + code + more, status: twRes.status }, { status: 502 });
    }

    return Response.json({ ok: true, status: twData.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}