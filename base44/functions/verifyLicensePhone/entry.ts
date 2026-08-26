import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { verifyAuthenticaOtp } from '../../shared/authenticaOtp.ts';

// Verifies an OTP for a real-estate license phone number via Authentica,
// WITHOUT overwriting the user's account phone (unlike verifyPhoneOtp, which
// reclaims the number onto the user profile). Used when a broker chooses
// option 2 — verifying a separate phone number that appears on their Fal
// license. Returns { ok, verified, phone } so the dialog can store it as
// re_license_phone at submission time.
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

    const result = await verifyAuthenticaOtp(base44, user, phone, code);
    if (!result.verified) {
      return Response.json({ error: result.error }, { status: result.status || 400 });
    }
    return Response.json({ ok: true, verified: true, phone });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}