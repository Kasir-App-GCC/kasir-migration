import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Checks whether a phone number is already claimed by another user.
// A number is considered claimed if it matches another user's WhatsApp number
// (stored as full digits) OR their registration phone (local digits + country code).
// `phone`  = full E.164 digits (e.g. "966512345678")
// `local`  = local digits without country code (e.g. "512345678")
// `cc`     = country code digits (e.g. "966")
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const full = (body?.phone || '').replace(/[^\d]/g, '');
    const local = (body?.local || '').replace(/[^\d]/g, '');
    const cc = (body?.cc || '').replace(/[^\d]/g, '');
    if (!full && !local) return Response.json({ error: 'Phone required' }, { status: 400 });

    const others = [];

    // 1) WhatsApp numbers are stored as full digits.
    //    Only a VERIFIED holder blocks the genuine owner — an unverified number
    //    is a squatter and must not deprive the real owner from verifying it.
    if (full) {
      const wa = await base44.asServiceRole.entities.User.filter({ whatsapp_number: full });
      (wa || []).forEach((u) => {
        if (u.id !== user.id && u.whatsapp_verified && !others.find((x) => x.id === u.id)) others.push(u);
      });
    }

    // 2) Registration phones are stored as local digits + a separate country_code.
    if (local) {
      const byLocal = await base44.asServiceRole.entities.User.filter({ phone: local });
      (byLocal || []).forEach((u) => {
        if (u.id === user.id) return;
        const uCc = (u.country_code || '').replace(/[^\d]/g, '');
        if (cc && uCc === cc && !others.find((x) => x.id === u.id)) others.push(u);
      });
    }

    return Response.json({ available: others.length === 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}