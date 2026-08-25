// Shared validation + duplicate-check logic for verification requests.
// Used by both submitVerification (manual admin-review flow) and
// createVerificationPayment (auto-verify on payment flow).

export interface VerificationInput {
  fullName: string;
  phone: string;
  nationalId: string;
}

export function parseVerificationInput(body: any): VerificationInput {
  return {
    fullName: (body?.fullName || "").trim(),
    phone: (body?.phone || "").trim(),
    nationalId: (body?.nationalId || "").trim(),
  };
}

export function validateVerificationInput(input: VerificationInput, user: any): string | null {
  if (!input.fullName || !input.phone || !input.nationalId) {
    return 'Missing required fields';
  }
  if (!user.avatar) {
    return 'Profile photo required';
  }
  return null;
}

export async function hasPendingVerification(base44: any, userId: string): Promise<boolean> {
  const existing = await base44.entities.VerificationRequest.filter(
    { user_id: userId, status: 'pending' },
    '-created_date',
    1
  );
  return !!(existing && existing.length > 0);
}