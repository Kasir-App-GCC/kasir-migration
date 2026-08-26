import { secrets } from 'base44:runtime';

// Creates a Moyasar invoice and returns { id, url }.
// After payment, Moyasar redirects to callbackUrl with ?id=<payment_id> appended.
// metadata: string key/value pairs stored on the invoice (max 10 keys).
export async function createMoyasarInvoice(params: {
  amountSar: number;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const secretKey = secrets.get('MOYASAR_SECRET_KEY');
  if (!secretKey) throw new Error('MOYASAR_SECRET_KEY not set');

  const amountHalalas = Math.round(params.amountSar * 100);
  const authHeader = 'Basic ' + btoa(secretKey + ':');

  const res = await fetch('https://api.moyasar.com/v1/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      amount: amountHalalas,
      currency: 'SAR',
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    }),
  });

  const data: any = await res.json();
  if (!res.ok) {
    const msg = data?.message || (typeof data?.errors === 'string' ? data.errors : `Moyasar error (${res.status})`);
    throw new Error(msg);
  }
  return { id: data.id, url: data.url };
}