"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pin: string;
  gstin: string;
  pan: string;
  idReference: string;
  occupation: string;
  notes: string;
}

const EMPTY: CustomerFormData = {
  name: "", phone: "", email: "", address: "", city: "", pin: "",
  gstin: "", pan: "", idReference: "", occupation: "", notes: "",
};

export function CustomerForm({
  initial,
  customerId,
  onSaved,
}: {
  initial?: Partial<CustomerFormData>;
  customerId?: string;
  onSaved?: (customerId: string) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerFormData>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof CustomerFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
    const res = await fetch(url, {
      method: customerId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save customer");
      setLoading(false);
      return;
    }
    setLoading(false);
    if (onSaved) {
      onSaved(data.customer.id);
      return;
    }
    router.push(`/customers/${data.customer.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" required maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Occupation</label>
          <input className="input" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <label className="label">PIN Code</label>
          <input className="input" maxLength={6} value={form.pin} onChange={(e) => set("pin", e.target.value)} />
        </div>
        <div>
          <label className="label">GSTIN (if business customer)</label>
          <input className="input uppercase" maxLength={15} value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="label">PAN</label>
          <input className="input uppercase" maxLength={10} value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">ID Reference (e.g. Aadhaar last 4 digits, DL number)</label>
          <input className="input" value={form.idReference} onChange={(e) => set("idReference", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Customer"}</button>
        {!onSaved && <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>}
      </div>
    </form>
  );
}
