// National ID format rules per country.
// Each rule defines the expected digit length and a validation pattern.
const ID_RULES = {
  SA: { length: 10, pattern: /^[12]\d{9}$/ },
  AE: { length: 15, pattern: /^\d{15}$/ },
  KW: { length: 12, pattern: /^\d{12}$/ },
  QA: { length: 11, pattern: /^\d{11}$/ },
  BH: { length: 9, pattern: /^\d{9}$/ },
  OM: { length: 8, pattern: /^\d{8}$/ },
};

export function nationalIdRule(country) {
  return ID_RULES[country] || ID_RULES.SA;
}

// Returns { valid, expected, digits }.
export function validateNationalId(id, country) {
  const digits = (id || "").replace(/\D/g, "");
  const rule = nationalIdRule(country);
  return { valid: rule.pattern.test(digits), expected: rule.length, digits };
}