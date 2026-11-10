"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";

interface SupplierForm {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  bankDetails: string;
  notes: string;
}

export default function EditSupplierPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<SupplierForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const s = data.supplier;
        setForm({
          companyName: s.companyName ?? "",
          contactPerson: s.contactPerson ?? "",
          phone: s.phone ?? "",
          email: s.email ?? "",
          address: s.address ?? "",
          gstin: s.gstin ?? "",
          bankDetails: s.bankDetails ?? "",
          notes: s.notes ?? "",
        });
      });
  }, [id]);

  function set<K extends keyof SupplierForm>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/suppliers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      setLoading(false);
      return;
    }
    router.push(`/suppliers/${id}`);
  }

  if (!form) return <div className="text-sm text-slate-500">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Supplier" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="label">Company Name</label>
          <input className="input" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Person</label>
            <input className="input" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="label">GSTIN</label>
            <input className="input uppercase" maxLength={15} value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className="label">Bank Details</label>
          <textarea className="input" rows={2} value={form.bankDetails} onChange={(e) => set("bankDetails", e.target.value)} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Changes"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
