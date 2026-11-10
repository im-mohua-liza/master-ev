import Link from "next/link";
import { computeProfitLoss, growthPct, previousPeriod } from "@/lib/profit-loss";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/data-table-shell";
import clsx from "clsx";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function resolveRange(preset: string, from?: string, to?: string) {
  const now = new Date();
  if (preset === "custom" && from && to) {
    const f = new Date(from);
    f.setHours(0, 0, 0, 0);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    return { from: f, to: t };
  }
  switch (preset) {
    case "today":
      return { from: startOfToday(), to: endOfToday() };
    case "quarter": {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { from: new Date(now.getFullYear(), qStartMonth, 1), to: endOfToday() };
    }
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfToday() };
    case "month":
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday() };
  }
}

const PRESETS = [
  { key: "today", label: "Daily" },
  { key: "month", label: "Monthly" },
  { key: "quarter", label: "Quarterly" },
  { key: "year", label: "Yearly" },
];

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const preset = sp.preset ?? "month";
  const { from, to } = resolveRange(preset, sp.from, sp.to);
  const prev = previousPeriod(from, to);

  const [current, previous] = await Promise.all([
    computeProfitLoss(from, to),
    computeProfitLoss(prev.from, prev.to),
  ]);

  const revenueGrowth = growthPct(current.totalRevenue, previous.totalRevenue);
  const expenseGrowth = growthPct(current.operatingExpenses, previous.operatingExpenses);

  return (
    <div>
      <PageHeader title="Profit & Loss" subtitle={`${from.toLocaleDateString("en-IN")} — ${to.toLocaleDateString("en-IN")}`} />

      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/profit-loss?preset=${p.key}`}
            className={clsx("px-3 py-1.5 rounded-lg text-sm border", preset === p.key ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50")}
          >
            {p.label}
          </Link>
        ))}
        <form className="flex items-center gap-2" action="/profit-loss">
          <input type="hidden" name="preset" value="custom" />
          <input type="date" name="from" defaultValue={sp.from} className="input !w-auto !py-1.5" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" name="to" defaultValue={sp.to} className="input !w-auto !py-1.5" />
          <button className="btn-secondary !py-1.5">Apply</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Statement</h2>
          <dl className="text-sm space-y-2">
            <Row label="Vehicle Sales Revenue (taxable value)" value={formatINR(current.vehicleRevenue)} />
            <Row label="Service Revenue" value={formatINR(current.serviceRevenue)} />
            <div className="border-t border-slate-200 pt-2"><Row label="Total Revenue" value={formatINR(current.totalRevenue)} bold /></div>
            <Row label="Vehicle Cost (purchase price)" value={`- ${formatINR(current.vehicleCost)}`} />
            <Row label="Service Cost (parts)" value={`- ${formatINR(current.serviceCost)}`} />
            <div className="border-t border-slate-200 pt-2"><Row label="Gross Profit" value={formatINR(current.grossProfit)} bold /></div>
            <Row label="Operating Expenses" value={`- ${formatINR(current.operatingExpenses)}`} />
            <div className="border-t border-slate-200 pt-2"><Row label="Net Profit" value={formatINR(current.netProfit)} bold tone={current.netProfit >= 0 ? "emerald" : "red"} /></div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="text-xs text-slate-500">Gross Profit Margin</div>
              <div className="text-xl font-bold text-slate-900">{current.grossProfitMargin}%</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500">Net Profit Margin</div>
              <div className={`text-xl font-bold ${current.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{current.netProfitMargin}%</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500">Revenue Growth vs previous period</div>
              <div className="text-xl font-bold text-slate-900">{revenueGrowth === null ? "—" : `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}%`}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500">Expense Growth vs previous period</div>
              <div className="text-xl font-bold text-slate-900">{expenseGrowth === null ? "—" : `${expenseGrowth > 0 ? "+" : ""}${expenseGrowth}%`}</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-slate-500">Scooters Sold in Period</div>
            <div className="text-xl font-bold text-slate-900">{current.unitsSold}</div>
          </div>
          <p className="text-xs text-slate-400">
            GST collected from customers is excluded from revenue and profit figures — it is
            not business income. Revenue is measured on taxable value only.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "emerald" | "red" }) {
  const toneClass = tone === "emerald" ? "text-emerald-700" : tone === "red" ? "text-red-600" : "text-slate-900";
  return (
    <div className={clsx("flex justify-between", bold ? `font-semibold ${toneClass}` : "text-slate-600")}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
