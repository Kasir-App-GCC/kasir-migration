import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isInternalInvocation } from '../../shared/internalAuth.ts';

// Deletes expired phone OTP records so the PhoneOtp table doesn't grow
// unbounded with stale verification attempts.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!isInternalInvocation(req)) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const nowIso = new Date().toISOString();
    await base44.asServiceRole.entities.PhoneOtp.deleteMany(
      { expires_at: { $lt: nowIso } }
    ).catch(() => {});
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}