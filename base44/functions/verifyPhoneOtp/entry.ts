import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Verifies an OTP via Twilio Verify's VerificationCheck endpoint (voice channel).
// A PhoneOtp record is used only for per-user attempt throttling and audit.
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

    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    const serviceSid = secrets.get('TWILIO_VERIFY_SERVICE_SID');
    if (!accountSid || !authToken || !serviceSid) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Code: code }).toString(),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || ('HTTP ' + res.status);
      return Response.json({ error: 'Twilio error: ' + msg }, { status: 400 });
    }

    if (data?.status === 'approved') {
      await base44.entities.PhoneOtp.update(pending.id, { verified: true });
      return Response.json({ ok: true, verified: true });
    }
    return Response.json({ error: 'Invalid code' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}