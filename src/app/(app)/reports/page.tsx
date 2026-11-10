"use client";

import { useState } from "react";
import { PageHeader } from "@/components/data-table-shell";
import { Download } from "lucide-react";

const REPORTS = [
  { type: "sales", label: "Sales Report", desc: "Every sale with pricing, GST and payment status", dated: true },
  { type: "gst", label: "GST Report", desc: "GST breakdown for tax filing", dated: true },
  { type: "outstanding", label: "Outstanding Report", desc: "Customers with pending balances", dated: false },
  { type: "inventory", label: "Inventory Report", desc: "Full vehicle stock with chassis numbers", dated: false },
  { type: "customers", label: "Customer Report", desc: "Customer database with purchase totals", dated: false },
  { type: "expenses", label: "Expense Report", desc: "All recorded business expenses", dated: true },
  { type: "payments", label: "Payment Report", desc: "All payments collected", dated: true },
  { type: "service", label: "Service Report", desc: "Service & maintenance records", dated: true },
  { type: "leads", label: "Lead Conversion Report", desc: "Leads with status and assignment", dated: false },
];

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function downloadUrl(type: string, dated: boolean) {
    if (!dated) return `/api/reports/${type}`;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/reports/${type}?${params.toString()}`;
  }

  return (
    <div>
      <PageHeader title="Reports Center" subtitle="Export business data as CSV (opens directly in Excel)" />

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-600">Date range for dated reports:</span>
        <input type="date" className="input !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-slate-400 text-sm">to</span>
        <input type="date" className="input !w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="text-xs text-slate-400">(leave blank for all-time)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div key={r.type} className="card p-5">
            <div className="font-semibold text-slate-900 text-sm">{r.label}</div>
            <div className="text-xs text-slate-500 mt-1 mb-4">{r.desc}</div>
            <a href={downloadUrl(r.type, r.dated)} className="btn-secondary text-sm">
              <Download size={14} /> Export CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
