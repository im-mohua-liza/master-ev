"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface PaymentRow {
  id: string;
  paymentCode: string;
  amount: number;
  method: string;
  paymentDate: string;
  referenceNumber: string | null;
  customer: { id: string; name: string };
  sale: { id: string; invoiceNumber: string | null; saleNumber: string } | null;
  recordedBy: { name: string } | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/payments?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setPayments(data.payments ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="All payments received from customers" actionLabel="Record Payment" actionHref="/payments/new" />
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        <SearchBox value={q} onChange={setQ} placeholder="Search payment code, reference, customer..." />
        <div className="text-sm text-slate-600">Total shown: <span className="font-semibold text-slate-900">{formatINR(total)}</span></div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Payment Code</th><th>Date</th><th>Customer</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Reference</th><th>Recorded By</th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.paymentCode}</td>
                <td>{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                <td><Link href={`/customers/${p.customer.id}`} className="text-emerald-700 hover:underline">{p.customer.name}</Link></td>
                <td>{p.sale ? <Link href={`/sales/${p.sale.id}`} className="text-emerald-700 hover:underline">{p.sale.invoiceNumber ?? p.sale.saleNumber}</Link> : "—"}</td>
                <td>{formatINR(p.amount)}</td>
                <td>{p.method.replaceAll("_", " ")}</td>
                <td>{p.referenceNumber ?? "—"}</td>
                <td>{p.recordedBy?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && payments.length === 0 && <EmptyState message="No payments recorded yet." />}
      </div>
    </div>
  );
}
