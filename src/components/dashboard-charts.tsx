"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#059669", "#0891b2", "#7c3aed", "#d97706", "#dc2626", "#2563eb", "#65a30d"];

export function RevenueProfitChart({ data }: { data: { month: string; revenue: number; profit: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />
        <Line type="monotone" dataKey="profit" stroke="#0891b2" strokeWidth={2} name="Gross Profit" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ModelSalesChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="count" fill="#059669" name="Units Sold" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBreakdownChart({ data }: { data: { name: string; amount: number }[] }) {
  const filtered = data.filter((d) => d.amount > 0);
  if (filtered.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={filtered} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">Not enough data yet</div>;
}
