import { prisma } from "./prisma";
import { round2 } from "./money";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [
    todaySales,
    monthSales,
    allActiveSales,
    vehiclesInStock,
    vehiclesSoldTotal,
    expensesAll,
    lowStockModels,
    overduePayments,
    upcomingTestRides,
    pendingFollowUps,
    monthlySalesRaw,
    modelWiseSalesRaw,
    expenseBreakdownRaw,
  ] = await Promise.all([
    prisma.sale.findMany({ where: { saleDate: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } } }),
    prisma.sale.findMany({ where: { saleDate: { gte: monthStart }, status: { not: "CANCELLED" } } }),
    prisma.sale.findMany({ where: { status: { not: "CANCELLED" } }, include: { vehicle: true } }),
    prisma.vehicle.count({ where: { status: "IN_STOCK" } }),
    prisma.vehicle.count({ where: { status: { in: ["SOLD", "DELIVERED"] } } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.vehicleModel.findMany({
      where: { isActive: true },
      include: { _count: { select: { vehicles: { where: { status: "IN_STOCK" } } } } },
    }),
    prisma.sale.findMany({
      where: { status: { not: "CANCELLED" }, balanceAmount: { gt: 0 } },
      include: { customer: true },
      orderBy: { saleDate: "asc" },
      take: 5,
    }),
    prisma.testRide.findMany({
      where: { status: "SCHEDULED", scheduledDate: { gte: todayStart, lte: todayEnd } },
      include: { model: true },
    }),
    prisma.lead.findMany({
      where: { followUpDate: { lte: todayEnd }, status: { notIn: ["SOLD", "LOST"] } },
      orderBy: { followUpDate: "asc" },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { status: { not: "CANCELLED" }, saleDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      select: { saleDate: true, grandTotal: true, taxableValue: true, vehicle: { select: { purchasePrice: true } } },
    }),
    prisma.sale.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { grandTotal: true, vehicle: { select: { model: { select: { brand: true, model: true } } } } },
    }),
    prisma.expense.groupBy({ by: ["categoryId"], _sum: { amount: true } }),
  ]);

  const totalRevenue = allActiveSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalGrossProfit = allActiveSales.reduce((sum, s) => sum + (s.taxableValue - s.vehicle.purchasePrice), 0);
  const totalExpenses = expensesAll._sum.amount ?? 0;
  const totalGstPayable = allActiveSales.reduce((sum, s) => sum + s.totalGst, 0);
  const customerDues = allActiveSales.reduce((sum, s) => sum + s.balanceAmount, 0);

  const lowStock = lowStockModels
    .filter((m) => m._count.vehicles <= 2)
    .map((m) => ({ name: `${m.brand} ${m.model}`, units: m._count.vehicles }));

  // Monthly revenue/profit trend (last 6 months)
  const monthBuckets = new Map<string, { revenue: number; profit: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    monthBuckets.set(key, { revenue: 0, profit: 0 });
  }
  for (const s of monthlySalesRaw) {
    const key = new Date(s.saleDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const bucket = monthBuckets.get(key);
    if (bucket) {
      bucket.revenue = round2(bucket.revenue + s.grandTotal);
      bucket.profit = round2(bucket.profit + (s.taxableValue - s.vehicle.purchasePrice));
    }
  }
  const monthlyTrend = Array.from(monthBuckets.entries()).map(([month, v]) => ({ month, ...v }));

  // Model-wise sales
  const modelMap = new Map<string, number>();
  for (const s of modelWiseSalesRaw) {
    const key = `${s.vehicle.model.brand} ${s.vehicle.model.model}`;
    modelMap.set(key, (modelMap.get(key) ?? 0) + 1);
  }
  const modelWiseSales = Array.from(modelMap.entries()).map(([name, count]) => ({ name, count }));

  // Expense breakdown by category
  const categories = await prisma.expenseCategory.findMany();
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const expenseBreakdown = expenseBreakdownRaw.map((e) => ({
    name: catMap.get(e.categoryId) ?? "Other",
    amount: e._sum.amount ?? 0,
  }));

  return {
    todaySalesCount: todaySales.length,
    todaySalesValue: round2(todaySales.reduce((s, x) => s + x.grandTotal, 0)),
    monthSalesCount: monthSales.length,
    monthSalesValue: round2(monthSales.reduce((s, x) => s + x.grandTotal, 0)),
    totalScootersSold: vehiclesSoldTotal,
    vehiclesInStock,
    totalRevenue: round2(totalRevenue),
    grossProfit: round2(totalGrossProfit),
    totalExpenses: round2(totalExpenses),
    netProfit: round2(totalGrossProfit - totalExpenses),
    customerDues: round2(customerDues),
    totalGstPayable: round2(totalGstPayable),
    lowStock,
    overduePayments,
    upcomingTestRides,
    pendingFollowUps,
    monthlyTrend,
    modelWiseSales,
    expenseBreakdown,
  };
}
