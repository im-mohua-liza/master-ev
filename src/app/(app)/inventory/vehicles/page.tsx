"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, StatusBadge, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface VehicleRow {
  id: string;
  vehicleCode: string;
  colour: string | null;
  sellingPrice: number;
  chassisNumber: string;
  status: string;
  model: { brand: string; model: string; variant: string | null };
  supplier: { companyName: string } | null;
}

const STATUS_TONE: Record<string, "green" | "yellow" | "red" | "slate" | "blue"> = {
  IN_STOCK: "green",
  RESERVED: "blue",
  SOLD: "yellow",
  DELIVERED: "slate",
  SERVICE: "yellow",
  DAMAGED: "red",
  RETURNED: "red",
};

const STATUSES = ["IN_STOCK", "RESERVED", "SOLD", "DELIVERED", "SERVICE", "DAMAGED", "RETURNED"];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/vehicles?${params.toString()}`);
    const data = await res.json();
    setVehicles(data.vehicles ?? []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Vehicle Stock" subtitle="Every scooter is tracked individually by chassis number" actionLabel="Add Vehicle" actionHref="/inventory/vehicles/new" />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search chassis, code, model..." />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Vehicle Code</th>
              <th>Model</th>
              <th>Colour</th>
              <th>Chassis No.</th>
              <th>Selling Price</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link href={`/inventory/vehicles/${v.id}`} className="font-medium text-emerald-700 hover:underline">
                    {v.vehicleCode}
                  </Link>
                </td>
                <td>{v.model.brand} {v.model.model} {v.model.variant}</td>
                <td>{v.colour ?? "—"}</td>
                <td>{v.chassisNumber}</td>
                <td>{formatINR(v.sellingPrice)}</td>
                <td>{v.supplier?.companyName ?? "—"}</td>
                <td><StatusBadge status={v.status} tone={STATUS_TONE[v.status] ?? "slate"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && vehicles.length === 0 && <EmptyState message="No vehicles in inventory yet." />}
      </div>
    </div>
  );
}
