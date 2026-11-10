"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, StatusBadge, EmptyState } from "@/components/data-table-shell";

interface TestRideRow {
  id: string;
  customerName: string;
  phone: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: string;
  model: { brand: string; model: string };
  salesperson: { name: string } | null;
}

const TONE: Record<string, "green" | "yellow" | "red" | "slate" | "blue"> = {
  SCHEDULED: "blue", COMPLETED: "green", CANCELLED: "red",
};

export default function TestRidesPage() {
  const [rides, setRides] = useState<TestRideRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (todayOnly) params.set("today", "1");
    const res = await fetch(`/api/test-rides?${params.toString()}`);
    const data = await res.json();
    setRides(data.testRides ?? []);
    setLoading(false);
  }, [q, status, todayOnly]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Test Rides" subtitle="Schedule and track customer test rides" actionLabel="Schedule Test Ride" actionHref="/test-rides/new" />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search customer, phone..." />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />
          Today only
        </label>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Model</th><th>Date</th><th>Time</th><th>Executive</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rides.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/test-rides/${r.id}/edit`} className="font-medium text-emerald-700 hover:underline">{r.customerName}</Link></td>
                <td>{r.phone}</td>
                <td>{r.model.brand} {r.model.model}</td>
                <td>{new Date(r.scheduledDate).toLocaleDateString("en-IN")}</td>
                <td>{r.scheduledTime ?? "—"}</td>
                <td>{r.salesperson?.name ?? "—"}</td>
                <td><StatusBadge status={r.status} tone={TONE[r.status] ?? "slate"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rides.length === 0 && <EmptyState message="No test rides scheduled." />}
      </div>
    </div>
  );
}
