"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";
import { FileUpload } from "@/components/file-upload";

interface CategoryOption { id: string; name: string }
const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"];

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    categoryId: "",
    description: "",
    amount: "",
    gst: "0",
    paymentMethod: "CASH",
    vendor: "",
    receiptUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/expense-categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save expense");
      setLoading(false);
      return;
    }
    router.push("/expenses");
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Add Expense" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" min="0" step="0.01" className="input" required value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </div>
          <div>
            <label className="label">GST Paid (₹, if any)</label>
            <input type="number" min="0" step="0.01" className="input" value={form.gst} onChange={(e) => set("gst", e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replaceAll("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Vendor</label>
            <input className="input" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Receipt</label>
          <FileUpload folder="receipts" value={form.receiptUrl} onChange={(url) => set("receiptUrl", url ?? "")} accept="image/*,application/pdf" label="Upload receipt" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Expense"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
