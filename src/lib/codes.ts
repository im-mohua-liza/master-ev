import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

const CODE_PREFIXES: Record<string, string> = {
  VEHICLE: "MEV-VH",
  CUSTOMER: "MEV-CU",
  LEAD: "MEV-LD",
  BOOKING: "MEV-BK",
  SALE: "MEV-SL",
  PAYMENT: "MEV-PY",
  EXPENSE: "MEV-EX",
  SERVICE: "MEV-SV",
};

/** Atomically increments and returns the next human-readable code for an entity type. */
export async function getNextCode(entityType: keyof typeof CODE_PREFIXES, tx: Tx = prisma): Promise<string> {
  const counter = await tx.codeCounter.upsert({
    where: { entityType },
    update: { lastNumber: { increment: 1 } },
    create: { entityType, lastNumber: 1 },
  });
  const prefix = CODE_PREFIXES[entityType];
  return `${prefix}-${String(counter.lastNumber).padStart(4, "0")}`;
}

/** Computes the Indian financial-year label (e.g. "2026-27") for a date, given FY start "MM-DD". */
export function financialYearLabel(date: Date, fyStartMMDD: string): string {
  const [startMonth, startDay] = fyStartMMDD.split("-").map(Number);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const afterStart = m > startMonth || (m === startMonth && d >= startDay);
  const fyStartYear = afterStart ? y : y - 1;
  const shortNext = String((fyStartYear + 1) % 100).padStart(2, "0");
  return `${fyStartYear}-${shortNext}`;
}

/** Atomically generates the next GST invoice number using the business's configured format. */
export async function getNextInvoiceNumber(tx: Tx = prisma): Promise<string> {
  const profile = await tx.businessProfile.findFirst();
  const prefix = profile?.invoicePrefix ?? "MEV";
  const format = profile?.invoiceFormat ?? "{PREFIX}/{FY}/{SEQ}";
  const fy = financialYearLabel(new Date(), profile?.financialYearStart ?? "04-01");

  const counter = await tx.invoiceCounter.upsert({
    where: { financialYear: fy },
    update: { lastNumber: { increment: 1 } },
    create: { financialYear: fy, lastNumber: 1 },
  });

  const seq = String(counter.lastNumber).padStart(4, "0");
  return format.replace("{PREFIX}", prefix).replace("{FY}", fy).replace("{SEQ}", seq);
}
