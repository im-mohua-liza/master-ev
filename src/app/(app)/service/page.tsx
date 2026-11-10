"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface ServiceRow {
  id: string;
  serviceCode: string;
  serviceDate: string;
  serviceType: string | null;
  issue: string | null;
  totalCost: number;
  vehicle: { id: string; vehicleCode: string; model: { brand: string; model: string } };
  customer: { name: string } | null;
  technician: { name: string } | null;
}

export default function ServicePage() {
  const [records, setRecords] = useState<ServiceRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/service?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setRecords(data.records ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Service Records" subtitle="EV service & maintenance history" actionLabel="Add Service Record" actionHref="/service/new" />
      <div className="mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search vehicle, customer, code..." />
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Code</th><th>Date</th><th>Vehicle</th><th>Customer</th><th>Type</th><th>Issue</th><th>Cost</th><th>Technician</th></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.serviceCode}</td>
                <td>{new Date(r.serviceDate).toLocaleDateString("en-IN")}</td>
                <td><Link href={`/inventory/vehicles/${r.vehicle.id}`} className="text-emerald-700 hover:underline">{r.vehicle.vehicleCode}</Link> — {r.vehicle.model.brand} {r.vehicle.model.model}</td>
                <td>{r.customer?.name ?? "—"}</td>
                <td>{r.serviceType ?? "—"}</td>
                <td>{r.issue ?? "—"}</td>
                <td>{formatINR(r.totalCost)}</td>
                <td>{r.technician?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && records.length === 0 && <EmptyState message="No service records yet." />}
      </div>
    </div>
  );
}
