"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface VehicleModelRow {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  range: string | null;
  topSpeed: string | null;
  exShowroomPrice: number | null;
  gstRate: number;
  isActive: boolean;
  _count: { vehicles: number };
}

export default function VehicleModelsPage() {
  const [models, setModels] = useState<VehicleModelRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/vehicle-models?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setModels(data.models ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Scooter Models" subtitle="Catalog of EV scooter brands & models you sell" actionLabel="Add Model" actionHref="/inventory/models/new" />
      <div className="mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search brand or model..." />
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Range</th>
              <th>Top Speed</th>
              <th>Ex-Showroom Price</th>
              <th>GST</th>
              <th>Units in Inventory</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <td>{m.brand}</td>
                <td>
                  <Link href={`/inventory/models/${m.id}/edit`} className="font-medium text-emerald-700 hover:underline">
                    {m.model} {m.variant}
                  </Link>
                </td>
                <td>{m.range ?? "—"}</td>
                <td>{m.topSpeed ?? "—"}</td>
                <td>{m.exShowroomPrice ? formatINR(m.exShowroomPrice) : "—"}</td>
                <td>{m.gstRate}%</td>
                <td>{m._count.vehicles}</td>
                <td>
                  <span className={`badge ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {m.isActive ? "Active" : "Archived"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && models.length === 0 && (
          <EmptyState message="No scooter models yet. Add your first model to start building your inventory." />
        )}
      </div>
    </div>
  );
}
