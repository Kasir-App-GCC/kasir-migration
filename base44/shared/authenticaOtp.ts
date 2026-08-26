import { secrets } from 'base44:runtime';

const MAX_ATTEMPTS = 5;

// Shared OTP verification against Authentica for a pending PhoneOtp record.
// Looks up the user's most recent unverified code for the given phone,
// enforces expiry + attempt limits, calls Authentica's verify endpoint, and
// marks the record verified on success. Returns { verified, pending } on
// success or { error, status } on failure. Does NOT touch the user profile —
// callers decide whether to reclaim the number (verifyPhoneOtp) or leave it
// alone (verifyLicensePhone).
export async function verifyAuthenticaOtp(base44, user, phone, code) {
  const records = await base44.entities.PhoneOtp.filter(
    { user_id: user.id, phone },
    '-created_date',
    10
  );
  const pending = (records || []).find((r) => !r.verified);
  if (!pending) return { error: 'No pending code', status: 400 };
  if (new Date(pending.expires_at) < new Date()) {
    return { error: 'Code expired', status: 400 };
  }
  if ((pending.attempts || 0) >= MAX_ATTEMPTS) {
    return { error: 'Too many attempts', status: 400 };
  }

  const apiKey = secrets.get('AUTHENTICA_API_KEY');
  if (!apiKey) return { error: 'Authentica not configured', status: 500 };

  await base44.entities.PhoneOtp.update(pending.id, { attempts: (pending.attempts || 0) + 1 });

  const res = await fetch('https://api.authentica.sa/api/v2/verify-otp', {
    method: 'POST',
    headers: {
      'X-Authorization': apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, otp: code }),
  });

  const data = await res.json().catch(() => ({}));
  if (data?.status === true || data?.verified === true || data?.success === true) {
    await base44.entities.PhoneOtp.update(pending.id, { verified: true });
    return { verified: true, pending };
  }
  const msg = data?.message || data?.errors?.[0]?.message || ('HTTP ' + res.status);
  return { error: 'Invalid code: ' + msg, status: 400 };
}