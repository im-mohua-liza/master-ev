"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/data-table-shell";
import { Trash2, Plus } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  isDefault: boolean;
  _count: { expenses: number };
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/expense-categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    setLoading(true);
    const res = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add category");
      return;
    }
    setNewName("");
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/expense-categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not delete category");
      return;
    }
    load();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Expense Categories" subtitle="Manage the categories available in Expenses" />
      <form onSubmit={onAdd} className="flex gap-2 mb-4">
        <input className="input" placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" disabled={loading} className="btn-primary"><Plus size={16} /> Add</button>
      </form>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-3">{error}</div>}
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Category</th><th>Expenses Recorded</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c._count.expenses}</td>
                <td>
                  <button onClick={() => onDelete(c.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
