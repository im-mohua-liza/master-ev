"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, EmptyState } from "@/components/data-table-shell";

interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  gstin: string | null;
  isActive: boolean;
  _count: { vehicles: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/suppliers?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSuppliers(data.suppliers ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Vehicle suppliers and dealers you purchase stock from" actionLabel="Add Supplier" actionHref="/suppliers/new" />
      <div className="mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name, phone, GSTIN..." />
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>GSTIN</th>
              <th>Vehicles Supplied</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/suppliers/${s.id}`} className="font-medium text-emerald-700 hover:underline">
                    {s.companyName}
                  </Link>
                </td>
                <td>{s.contactPerson ?? "—"}</td>
                <td>{s.phone ?? "—"}</td>
                <td>{s.gstin ?? "—"}</td>
                <td>{s._count.vehicles}</td>
                <td>
                  <span className={`badge ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.isActive ? "Active" : "Archived"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && suppliers.length === 0 && <EmptyState message="No suppliers yet. Add your first supplier to get started." />}
      </div>
    </div>
  );
}
