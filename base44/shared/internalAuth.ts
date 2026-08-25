import { secrets } from 'base44:runtime';

// Verifies that a backend-function request was made by the platform's internal
// workflow runner (or another internal service), not by an external public
// caller hitting the function URL.
//
// The Base44 dispatcher injects a signed `base44-service-authorization`
// service token on internal invocations (workflows, automations, and
// function-to-function calls). The token is a JWT signed with the app's
// WORKFLOW_SECRET (HMAC-SHA256). We verify the signature before trusting any
// claim in the payload, so a forged header carrying `internal_service_token`
// without a valid signature is rejected. External callers cannot obtain a
// valid signature because they do not know WORKFLOW_SECRET.
export async function isInternalInvocation(req: Request): Promise<boolean> {
  const header = req.headers.get("base44-service-authorization");
  if (!header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const parts = String(token).split(".");
  if (parts.length !== 3) return false;
  const secret = secrets.get("WORKFLOW_SECRET");
  if (!secret) return false;
  try {
    const signatureValid = await verifyHmacSha256(
      `${parts[0]}.${parts[1]}`,
      parts[2],
      secret
    );
    if (!signatureValid) return false;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const flag = payload?.internal_service_token;
    return flag === true || flag === "true";
  } catch {
    return false;
  }
}

async function verifyHmacSha256(
  data: string,
  signatureB64Url: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = decodeBase64UrlBytes(signatureB64Url);
  const dataBytes = new TextEncoder().encode(data);
  return crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
}

function decodeBase64Url(input: string): string {
  return new TextDecoder().decode(decodeBase64UrlBytes(input));
}

function decodeBase64UrlBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}