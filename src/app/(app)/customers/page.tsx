"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, EmptyState } from "@/components/data-table-shell";

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  city: string | null;
  _count: { sales: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Complete customer database & purchase history" actionLabel="Add Customer" actionHref="/customers/new" />
      <div className="mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, phone, code..." />
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Customer Code</th><th>Name</th><th>Phone</th><th>City</th><th>Purchases</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.customerCode}</td>
                <td><Link href={`/customers/${c.id}`} className="font-medium text-emerald-700 hover:underline">{c.name}</Link></td>
                <td>{c.phone}</td>
                <td>{c.city ?? "—"}</td>
                <td>{c._count.sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && customers.length === 0 && <EmptyState message="No customers yet. Add your first customer to get started." />}
      </div>
    </div>
  );
}
