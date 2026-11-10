import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatINR } from "@/lib/money";
import { StatCard } from "@/components/stat-card";
import { RevenueProfitChart, ModelSalesChart, ExpenseBreakdownChart } from "@/components/dashboard-charts";
import {
  IndianRupee, TrendingUp, Bike, Warehouse, Users, Wallet, Receipt,
  AlertTriangle, Clock, CalendarClock, ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const [data, modelCount, supplierCount, vehicleCount, userCount] = await Promise.all([
    getDashboardData(),
    prisma.vehicleModel.count(),
    prisma.supplier.count(),
    prisma.vehicle.count(),
    prisma.user.count(),
  ]);

  const checklist = [
    { label: "Add a Scooter Model", done: modelCount > 0, href: "/inventory/models/new" },
    { label: "Add a Supplier", done: supplierCount > 0, href: "/suppliers/new" },
    { label: "Add Vehicles to Inventory", done: vehicleCount > 0, href: "/inventory/vehicles/new" },
    { label: "Add Staff Accounts", done: userCount > 1, href: "/settings/users" },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back — here&apos;s how the showroom is doing today.</p>
      </div>

      {checklistDone < checklist.length && (
        <div className="card p-5 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Getting Started ({checklistDone}/{checklist.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {checklist.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${c.done ? "border-emerald-200 bg-white text-slate-400 line-through" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}
              >
                {c.label}
                {!c.done && <ArrowRight size={14} />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(data.lowStock.length > 0 || data.overduePayments.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.lowStock.length > 0 && (
            <div className="card p-4 border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
                <AlertTriangle size={16} /> Low Stock Alert
              </div>
              <ul className="text-sm text-amber-900 space-y-1">
                {data.lowStock.map((m) => (
                  <li key={m.name}>Only {m.units} unit{m.units === 1 ? "" : "s"} remaining of {m.name}</li>
                ))}
              </ul>
            </div>
          )}
          {data.overduePayments.length > 0 && (
            <div className="card p-4 border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2 text-red-800 font-semibold text-sm mb-2">
                <Wallet size={16} /> Payment Alert
              </div>
              <ul className="text-sm text-red-900 space-y-1">
                {data.overduePayments.map((s) => (
                  <li key={s.id}>
                    <Link href={`/sales/${s.id}`} className="hover:underline">
                      {formatINR(s.balanceAmount)} due from {s.customer.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={`${data.todaySalesCount} · ${formatINR(data.todaySalesValue)}`} icon={IndianRupee} tone="emerald" />
        <StatCard label="This Month's Sales" value={`${data.monthSalesCount} · ${formatINR(data.monthSalesValue)}`} icon={TrendingUp} tone="emerald" />
        <StatCard label="Total Scooters Sold" value={String(data.totalScootersSold)} icon={Bike} tone="blue" />
        <StatCard label="Scooters In Stock" value={String(data.vehiclesInStock)} icon={Warehouse} tone="blue" />
        <StatCard label="Total Revenue" value={formatINR(data.totalRevenue)} icon={IndianRupee} tone="emerald" />
        <StatCard label="Gross Profit" value={formatINR(data.grossProfit)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Net Profit" value={formatINR(data.netProfit)} icon={TrendingUp} tone={data.netProfit >= 0 ? "emerald" : "red"} />
        <StatCard label="Customer Dues" value={formatINR(data.customerDues)} icon={Users} tone="amber" />
        <StatCard label="Total Expenses" value={formatINR(data.totalExpenses)} icon={Receipt} tone="red" />
        <StatCard label="GST Payable (collected)" value={formatINR(data.totalGstPayable)} icon={Receipt} tone="slate" hint="Collected from customers, not profit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Revenue & Profit Trend</h2>
          <RevenueProfitChart data={data.monthlyTrend} />
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Scooter Sales by Model</h2>
          <ModelSalesChart data={data.modelWiseSales} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Expense Breakdown</h2>
          <ExpenseBreakdownChart data={data.expenseBreakdown} />
        </div>
        <div className="space-y-6">
          {data.upcomingTestRides.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                <CalendarClock size={16} /> Today&apos;s Test Rides
              </div>
              <ul className="text-sm space-y-1">
                {data.upcomingTestRides.map((t) => (
                  <li key={t.id} className="flex justify-between text-slate-700">
                    <span>{t.customerName} — {t.model.brand} {t.model.model}</span>
                    <span className="text-slate-400">{t.scheduledTime ?? ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.pendingFollowUps.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                <Clock size={16} /> Follow-ups Due
              </div>
              <ul className="text-sm space-y-1">
                {data.pendingFollowUps.map((l) => (
                  <li key={l.id}>
                    <Link href={`/leads/${l.id}/edit`} className="text-slate-700 hover:text-emerald-700">{l.name} — {l.phone}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
