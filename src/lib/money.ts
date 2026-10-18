// One formatter for server and client so rendered prices always match (no hydration mismatch).
const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number | string, currency = "usd") {
  const key = currency.toLowerCase();
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: key.toUpperCase() });
    formatters.set(key, formatter);
  }
  return formatter.format(Number(amount));
}

// Stripe amounts are integers in the smallest unit (cents).
export function toMinorUnits(amount: number | string) {
  return Math.round(Number(amount) * 100);
}

// Postgres numeric arrives as a string or number; normalise to a 2-decimal number.
export function toAmount(value: number | string | null | undefined) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}
