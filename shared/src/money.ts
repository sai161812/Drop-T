/** Supported proposal currencies and their minor-unit precision. */
export const CURRENCY_MINOR_DIGITS: Readonly<Record<string, number>> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0
};

/** Convert a JSON decimal amount to integer minor units without multiplying a binary float. */
export function toMinorUnits(amount: number, currency: string): number | null {
  const digits = CURRENCY_MINOR_DIGITS[currency.toUpperCase()];
  if (digits === undefined || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return null;
  const decimal = String(amount);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(decimal);
  if (!match) return null;
  const fraction = match[2] || '';
  if (fraction.length > digits) return null;
  const scale = 10n ** BigInt(digits);
  const fractionValue = digits === 0 ? 0n : BigInt((fraction + '0'.repeat(digits)).slice(0, digits) || '0');
  const minor = BigInt(match[1]) * scale + fractionValue;
  if (minor <= 0n || minor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(minor);
}

export function fromMinorUnits(minor: number, currency: string): number {
  const digits = CURRENCY_MINOR_DIGITS[currency.toUpperCase()] ?? 2;
  return minor / (10 ** digits);
}
