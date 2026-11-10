"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface CustomerOption { id: string; name: string; phone: string }
interface SaleOption { id: string; saleNumber: string; invoiceNumber: string | null; balanceAmount: number; customerId: string }

const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "FINANCE", "CHEQUE", "OTHER"];

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [sales, setSales] = useState<SaleOption[]>([]);
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [saleId, setSaleId] = useState(searchParams.get("saleId") ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
    fetch("/api/sales?paymentStatus=DUE").then((r) => r.json()).then((d) => setSales(d.sales ?? []));
    fetch("/api/sales?paymentStatus=PARTIAL").then((r) => r.json()).then((d) =>
      setSales((prev) => [...prev, ...(d.sales ?? [])])
    );
  }, []);

  const customerSales = sales.filter((s) => !customerId || s.customerId === customerId);
  const selectedSale = sales.find((s) => s.id === saleId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, saleId: saleId || undefined, amount, method, paymentDate, referenceNumber, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not record payment");
      setLoading(false);
      return;
    }
    router.push(saleId ? `/sales/${saleId}` : `/customers/${customerId}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Record Payment" subtitle="Log a payment received from a customer" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="label">Customer</label>
          <select className="input" required value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSaleId(""); }}>
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Against Invoice (optional)</label>
          <select className="input" value={saleId} onChange={(e) => setSaleId(e.target.value)}>
            <option value="">General payment (not tied to an invoice)</option>
            {customerSales.map((s) => (
              <option key={s.id} value={s.id}>{s.invoiceNumber ?? s.saleNumber} — Due {formatINR(s.balanceAmount)}</option>
            ))}
          </select>
          {selectedSale && <p className="text-xs text-slate-500 mt-1">Outstanding balance: {formatINR(selectedSale.balanceAmount)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" min="0" step="0.01" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replaceAll("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Reference Number</label>
            <input className="input" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="UPI ref / cheque no." />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Record Payment"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
