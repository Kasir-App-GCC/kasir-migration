// Server-side featured-listing promotion pricing — identical formula to
// src/lib/boostPricing.js. Kept here so the stored BoostRequest amount is
// computed authoritatively and can't be tampered with from the client.
//   basePrice       = 5 + 20 * ln(1 + P / 500)     (P = item price in SAR)
//   calculatedPrice = basePrice * (H / 24) ^ 0.70  (H = promotion hours)
//   finalPrice      = max(5, calculatedPrice)      (rounded to 2 decimals)

export const BOOST_MAX_HOURS = 168;
export const BOOST_MIN_HOURS = 2;

export function computeBoostPrice(price, hours, crossCountry = false) {
  const P = Math.max(0, Number(price) || 0);
  const H = Math.max(0, Math.min(BOOST_MAX_HOURS, Number(hours) || 0));
  const basePrice = 5 + 20 * Math.log(1 + P / 500);
  const calculatedPrice = basePrice * Math.pow(H / 24, 0.70);
  const finalPrice = Math.max(5, calculatedPrice);
  const amount = crossCountry ? finalPrice * 1.75 : finalPrice;
  return {
    basePrice,
    calculatedPrice,
    amount: Math.round(amount * 100) / 100,
  };
}