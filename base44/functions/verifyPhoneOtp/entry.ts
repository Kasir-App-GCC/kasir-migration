import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { verifyAuthenticaOtp } from '../../shared/authenticaOtp.ts';

// Verifies the user-entered OTP against Authentica's verify endpoint by phone + code.
// On success, persists the verified phone on the user profile so it survives
// page refreshes, and reclaims the number from any unverified squatters.
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

    const digits = phone.replace(/\D/g, "");
    if (digits) {
      try {
        await base44.asServiceRole.entities.User.update(user.id, {
          phone: digits,
          phone_verified: true,
        });
      } catch (e) {}
      // Reclaim the number: clear it from any other user who holds it but never
      // verified it (squatters), so the genuine — now verified — owner is the
      // sole holder. Verified holders are left untouched (a real conflict).
      try {
        await base44.asServiceRole.entities.User.updateMany(
          { whatsapp_number: digits, whatsapp_verified: { $ne: true } },
          { $unset: { whatsapp_number: "" } }
        );
      } catch {}
    }
    return Response.json({ ok: true, verified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}