import { getCountry } from "@/lib/countries";

// Build an E.164 phone string (e.g. +966512345678) from a user's stored
// country_code + local phone digits. Handles common edge cases: a leading
// trunk zero, and the local number already containing the country code.
export function userPhoneE164(user) {
  if (!user) return "";
  let cc = (user.country_code || "").replace(/[^\d+]/g, "");
  if (!cc) {
    const c = getCountry(user.country || "SA");
    cc = c.phoneCode;
  }
  let local = (user.phone || "").replace(/\D/g, "");
  if (!local) return "";
  // strip a leading trunk zero (e.g. 0512345678 -> 512345678)
  local = local.replace(/^0+/, "");
  const ccDigits = cc.replace("+", "");
  // if the local number already starts with the country code, avoid duplication
  if (ccDigits && local.startsWith(ccDigits)) {
    local = local.slice(ccDigits.length).replace(/^0+/, "");
  }
  return "+" + ccDigits + local;
}

export function digitsOnly(e164) {
  return (e164 || "").replace(/[^\d]/g, "");
}

// GCC local number lengths: 8 digits (OM/BH/KW/QA) to 9 digits (SA/AE).
// All phone inputs across the app cap the local part at this max so the
// full E.164 number stays within the valid range for every GCC country.
export const GCC_MAX_LOCAL = 9;
export const GCC_MIN_LOCAL = 8;