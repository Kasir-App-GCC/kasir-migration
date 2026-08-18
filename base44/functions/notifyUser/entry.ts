import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const FROM_NAME = "Kasir Support";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const userId = (body.user_id || "").trim();
    const subject = (body.subject || "").trim().slice(0, 200);
    const text = (body.body || "").trim().slice(0, 5000);

    if (!userId || !subject || !text) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let user;
    try {
      user = await base44.asServiceRole.entities.User.get(userId);
    } catch {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.email) return Response.json({ error: 'User has no email' }, { status: 400 });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: FROM_NAME,
      subject,
      body: text,
    });

    return Response.json({ success: true, sent_to: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}