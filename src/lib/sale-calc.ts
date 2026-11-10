import { round2 } from "./money";

export interface SaleCalcInput {
  /** GST-inclusive listed selling price of the scooter. */
  basePrice: number;
  discount: number;
  exchangeValue: number;
  gstRate: number;
  amountPaid: number;
  gstType: "INTRA" | "INTER";
}

export interface SaleCalcResult {
  basePrice: number;
  discount: number;
  priceAfterDiscount: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
  exchangeValue: number;
  amountPaid: number;
  balanceAmount: number;
  paymentStatus: "PAID" | "PARTIAL" | "DUE";
}

/**
 * Core showroom sale calculation, shared by the New Sale form, the invoice
 * generator, and vehicle-wise profit reports so every part of the app
 * agrees on the numbers.
 *
 * `basePrice` is treated as GST-inclusive (the price quoted to the
 * customer). GST is derived from the post-discount price rather than added
 * on top, matching how ex-showroom EV pricing is normally presented.
 */
export function calculateSale(input: SaleCalcInput): SaleCalcResult {
  const basePrice = round2(input.basePrice);
  const discount = round2(Math.min(input.discount, basePrice));
  const priceAfterDiscount = round2(basePrice - discount);

  const gstRate = input.gstRate;
  const taxableValue = round2(priceAfterDiscount / (1 + gstRate / 100));
  const totalGst = round2(priceAfterDiscount - taxableValue);

  const cgst = input.gstType === "INTRA" ? round2(totalGst / 2) : 0;
  const sgst = input.gstType === "INTRA" ? round2(totalGst - cgst) : 0;
  const igst = input.gstType === "INTER" ? totalGst : 0;

  const grandTotal = priceAfterDiscount;
  const exchangeValue = round2(Math.max(0, input.exchangeValue));
  const amountPaid = round2(Math.max(0, input.amountPaid));
  const balanceAmount = round2(Math.max(0, grandTotal - exchangeValue - amountPaid));

  const effectivelyPaid = round2(exchangeValue + amountPaid);
  let paymentStatus: SaleCalcResult["paymentStatus"] = "DUE";
  if (balanceAmount <= 0) paymentStatus = "PAID";
  else if (effectivelyPaid > 0) paymentStatus = "PARTIAL";

  return {
    basePrice,
    discount,
    priceAfterDiscount,
    taxableValue,
    gstRate,
    cgst,
    sgst,
    igst,
    totalGst,
    grandTotal,
    exchangeValue,
    amountPaid,
    balanceAmount,
    paymentStatus,
  };
}

/** Actual business profit for one sold scooter (never confuse with GST collected). */
export function vehicleProfit(params: {
  purchasePrice: number;
  taxableValue: number;
  accessoriesCost?: number;
  otherCost?: number;
}): number {
  const { purchasePrice, taxableValue, accessoriesCost = 0, otherCost = 0 } = params;
  return round2(taxableValue - purchasePrice - accessoriesCost - otherCost);
}
