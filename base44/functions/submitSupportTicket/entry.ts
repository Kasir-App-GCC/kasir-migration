import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SUPPORT_EMAIL = "support@kasir-app.com";
const FROM_NAME = "Souqna Support";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fullName = (body.fullName || "").trim();
    const phone = (body.phone || "").trim();
    const email = (body.email || "").trim();
    const category = body.category || 'general';
    const subject = (body.subject || "").trim();
    const message = (body.message || "").trim();

    if (!fullName || !phone || !email || !subject || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the ticket record
    const ticket = await base44.entities.SupportTicket.create({
      user_id: user.id,
      user_name: fullName,
      user_email: email,
      phone,
      category,
      subject,
      message,
      status: 'open',
    });

    // Generate a human-friendly ticket number
    const ticketNumber = 'TKT-' + ticket.id.slice(-8).toUpperCase();

    // Email the support team
    const supportBody = [
      'New support ticket received.',
      '',
      'Ticket #: ' + ticketNumber,
      'From: ' + fullName,
      'Email: ' + email,
      'Phone: ' + phone,
      'Category: ' + category,
      'Subject: ' + subject,
      '',
      'Message:',
      message,
    ].join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: SUPPORT_EMAIL,
      subject: '[' + ticketNumber + '] ' + subject,
      body: supportBody,
    });

    // Send confirmation email to the user
    const userBody = [
      'Dear ' + fullName + ',',
      '',
      "We have received your support request. Our team will get back to you as soon as possible.",
      '',
      'Ticket #: ' + ticketNumber,
      'Subject: ' + subject,
      'Category: ' + category,
      '',
      'Your message:',
      message,
      '',
      'Thank you for reaching out to Souqna Support.',
    ].join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: FROM_NAME,
      subject: 'Support Ticket ' + ticketNumber + " — We've received your message",
      body: userBody,
    });

    return Response.json({ ticketNumber, ticketId: ticket.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}