import { prisma } from "./prisma";
import { round2 } from "./money";

export interface ProfitLossResult {
  vehicleRevenue: number;
  vehicleCost: number;
  serviceRevenue: number;
  serviceCost: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  unitsSold: number;
}

export async function computeProfitLoss(from: Date, to: Date): Promise<ProfitLossResult> {
  const [sales, services, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { status: { not: "CANCELLED" }, saleDate: { gte: from, lte: to } },
      include: { vehicle: true },
    }),
    prisma.serviceRecord.findMany({ where: { serviceDate: { gte: from, lte: to } } }),
    prisma.expense.aggregate({ where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
  ]);

  const vehicleRevenue = round2(sales.reduce((s, x) => s + x.taxableValue, 0));
  const vehicleCost = round2(sales.reduce((s, x) => s + x.vehicle.purchasePrice, 0));
  const serviceRevenue = round2(services.reduce((s, x) => s + x.totalCost, 0));
  const serviceCost = round2(services.reduce((s, x) => s + x.partsCost, 0));

  const totalRevenue = round2(vehicleRevenue + serviceRevenue);
  const totalCost = round2(vehicleCost + serviceCost);
  const grossProfit = round2(totalRevenue - totalCost);
  const operatingExpenses = round2(expenses._sum.amount ?? 0);
  const netProfit = round2(grossProfit - operatingExpenses);

  return {
    vehicleRevenue,
    vehicleCost,
    serviceRevenue,
    serviceCost,
    totalRevenue,
    totalCost,
    grossProfit,
    operatingExpenses,
    netProfit,
    grossProfitMargin: totalRevenue > 0 ? round2((grossProfit / totalRevenue) * 100) : 0,
    netProfitMargin: totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : 0,
    unitsSold: sales.length,
  };
}

export function growthPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round2(((current - previous) / Math.abs(previous)) * 100);
}

export function previousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const lengthMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - lengthMs);
  return { from: prevFrom, to: prevTo };
}
