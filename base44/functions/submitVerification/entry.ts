import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { parseVerificationInput, validateVerificationInput, hasPendingVerification } from '../../shared/verificationValidation.ts';

const SUPPORT_EMAIL = "support@kasir-app.com";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const input = parseVerificationInput(body);
    const validationError = validateVerificationInput(input, user);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // Block duplicate pending requests — a user cannot submit another while under review.
    if (await hasPendingVerification(base44, user.id)) {
      return Response.json({ error: 'You already have a pending verification request' }, { status: 409 });
    }

    // Phone uniqueness is enforced at OTP-send time (checkPhoneUnique) in the
    // verification dialog, so the number the user verified is already theirs.
    const request = await base44.entities.VerificationRequest.create({
      user_id: user.id,
      user_name: user.name || input.fullName,
      user_email: user.email,
      full_name: input.fullName,
      phone: input.phone,
      national_id: input.nationalId,
      status: 'pending',
    });

    const reqNumber = 'VER-' + request.id.slice(-8).toUpperCase();

    // Mark the phone as verified on the user profile so it remains verified.
    try {
      await base44.asServiceRole.entities.User.update(user.id, { phone_verified: true });
    } catch (e) {}

    // Email the support team (best-effort — only delivers if the recipient is a registered app user).
    const supportBody = [
      'New verification request.',
      '',
      'Request #: ' + reqNumber,
      'User: ' + (user.name || input.fullName),
      'Email: ' + (user.email || '—'),
      'Full name: ' + input.fullName,
      'Phone: ' + input.phone,
      'National ID: ' + input.nationalId,
      '',
      'Review it in the Admin Panel > Verifications.',
    ].join('\n');

    let supportEmailOk = true;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: SUPPORT_EMAIL,
        subject: '[' + reqNumber + '] Verification Request',
        body: supportBody,
      });
    } catch (e) {
      supportEmailOk = false;
    }

    // In-app notification to the user that the request was submitted.
    try {
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'verification_submitted',
        text: 'Your verification request has been submitted. We will review it shortly.',
      });
    } catch (e) {}

    return Response.json({ requestId: request.id, requestNumber: reqNumber, supportEmailOk });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}