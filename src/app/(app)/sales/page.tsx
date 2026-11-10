"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, StatusBadge, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface SaleRow {
  id: string;
  saleNumber: string;
  invoiceNumber: string | null;
  saleDate: string;
  grandTotal: number;
  balanceAmount: number;
  paymentStatus: string;
  status: string;
  customer: { name: string };
  vehicle: { vehicleCode: string; model: { brand: string; model: string } };
  salesperson: { name: string } | null;
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    const res = await fetch(`/api/sales?${params.toString()}`);
    const data = await res.json();
    setSales(data.sales ?? []);
    setLoading(false);
  }, [q, paymentStatus]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Sales & Invoices" subtitle="All scooter sales and GST invoices" actionLabel="New Sale" actionHref="/sales/new" />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search invoice, customer, chassis..." />
        <select className="input w-auto" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All payment statuses</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="DUE">Due</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Amount</th><th>Balance</th><th>Salesperson</th><th>Status</th></tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td><Link href={`/sales/${s.id}`} className="font-medium text-emerald-700 hover:underline">{s.invoiceNumber ?? s.saleNumber}</Link></td>
                <td>{new Date(s.saleDate).toLocaleDateString("en-IN")}</td>
                <td>{s.customer.name}</td>
                <td>{s.vehicle.vehicleCode} — {s.vehicle.model.brand} {s.vehicle.model.model}</td>
                <td>{formatINR(s.grandTotal)}</td>
                <td>{formatINR(s.balanceAmount)}</td>
                <td>{s.salesperson?.name ?? "—"}</td>
                <td>
                  {s.status === "CANCELLED" ? (
                    <StatusBadge status="Cancelled" tone="red" />
                  ) : (
                    <StatusBadge status={s.paymentStatus} tone={s.paymentStatus === "PAID" ? "green" : s.paymentStatus === "PARTIAL" ? "yellow" : "red"} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sales.length === 0 && <EmptyState message="No sales recorded yet." />}
      </div>
    </div>
  );
}
