"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, SearchBox, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";
import { Trash2 } from "lucide-react";

interface ExpenseRow {
  id: string;
  expenseCode: string;
  date: string;
  description: string | null;
  amount: number;
  vendor: string | null;
  paymentMethod: string | null;
  category: { name: string };
  recordedBy: { name: string } | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function onDelete(id: string, code: string) {
    if (!confirm(`Delete expense ${code}? This cannot be undone.`)) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not delete");
      return;
    }
    load();
  }

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track business running costs" actionLabel="Add Expense" actionHref="/expenses/new" />
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        <SearchBox value={q} onChange={setQ} placeholder="Search description, vendor..." />
        <div className="text-sm text-slate-600">Total shown: <span className="font-semibold text-slate-900">{formatINR(total)}</span></div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Code</th><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th><th>Method</th><th>Recorded By</th><th></th></tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{e.expenseCode}</td>
                <td>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                <td>{e.category.name}</td>
                <td>{e.description ?? "—"}</td>
                <td>{e.vendor ?? "—"}</td>
                <td>{formatINR(e.amount)}</td>
                <td>{e.paymentMethod?.replaceAll("_", " ") ?? "—"}</td>
                <td>{e.recordedBy?.name ?? "—"}</td>
                <td>
                  <button onClick={() => onDelete(e.id, e.expenseCode)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && expenses.length === 0 && <EmptyState message="No expenses recorded yet." />}
      </div>
    </div>
  );
}
