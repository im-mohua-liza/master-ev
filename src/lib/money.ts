// Currency handling for INR. Amounts are stored as plain rupee floats and
// rounded to 2 decimals at every calculation step to avoid drift.

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatINR(value: number | null | undefined): string {
  const n = round2(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(value: number | null | undefined): string {
  const n = round2(value ?? 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += ONES[h] + " Hundred";
  if (rest) out += (h ? " " : "") + twoDigits(rest);
  return out;
}

/** Converts a rupee amount into words using the Indian numbering system. */
export function amountInWords(value: number): string {
  const n = Math.floor(round2(value));
  const paise = Math.round((round2(value) - n) * 100);

  if (n === 0 && paise === 0) return "Zero Rupees Only";

  let remaining = n;
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundred = remaining;

  const parts: string[] = [];
  if (crore) parts.push(threeDigits(crore) + " Crore");
  if (lakh) parts.push(twoDigits(lakh) + " Lakh");
  if (thousand) parts.push(twoDigits(thousand) + " Thousand");
  if (hundred) parts.push(threeDigits(hundred));

  let words = parts.join(" ") + " Rupees";
  if (paise > 0) {
    words += " and " + twoDigits(paise) + " Paise";
  }
  return words + " Only";
}
