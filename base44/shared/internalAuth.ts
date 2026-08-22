// Verifies that a backend-function request was made by the platform's internal
// workflow runner (or another internal service), not by an external public
// caller hitting the function URL.
//
// The Base44 dispatcher injects a signed `base44-service-authorization`
// service token on internal invocations (workflows, automations, and
// function-to-function calls). External callers cannot obtain a valid one,
// and the platform edge validates the signature before the function runs.
// We decode the JWT payload and confirm it carries the internal-service flag,
// which lets us reject direct public-URL abuse without any shared secret.
export function isInternalInvocation(req: Request): boolean {
  const header = req.headers.get("base44-service-authorization");
  if (!header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const parts = String(token).split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const flag = payload?.internal_service_token;
    return flag === true || flag === "true";
  } catch {
    return false;
  }
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}