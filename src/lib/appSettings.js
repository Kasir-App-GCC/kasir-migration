import { base44 } from "@/api/base44Client";

// Small client-side cache for the global payments mode setting so we don't
// re-fetch AppSetting on every post. The setting is public-readable.
let modeCache = null;

export async function getPaymentsMode() {
  if (modeCache) return modeCache;
  try {
    const rows = await base44.entities.AppSetting.filter({ key: "payments_mode" });
    modeCache = rows && rows[0] ? rows[0].value : "inapp";
  } catch {
    modeCache = "inapp";
  }
  return modeCache;
}

export async function setPaymentsMode(value) {
  const rows = await base44.entities.AppSetting.filter({ key: "payments_mode" });
  if (rows && rows[0]) await base44.entities.AppSetting.update(rows[0].id, { value });
  else await base44.entities.AppSetting.create({ key: "payments_mode", value });
  modeCache = value;
  return value;
}

export function resetPaymentsModeCache() {
  modeCache = null;
}