"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";

interface VehicleOption { id: string; vehicleCode: string; model: { brand: string; model: string } }
interface CustomerOption { id: string; name: string; phone: string }
interface UserOption { id: string; name: string; isActive: boolean }

export default function NewServiceRecordPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState({
    vehicleId: "", customerId: "", serviceDate: new Date().toISOString().slice(0, 10),
    odometer: "", serviceType: "", issue: "", partsUsed: "",
    labourCharge: "0", partsCost: "0", technicianId: "", notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? []));
    fetch("/api/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers((d.users ?? []).filter((u: UserOption) => u.isActive)));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save service record");
      setLoading(false);
      return;
    }
    router.push("/service");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Service Record" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vehicle</label>
            <select className="input" required value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleCode} — {v.model.brand} {v.model.model}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Customer</label>
            <select className="input" value={form.customerId} onChange={(e) => set("customerId", e.target.value)}>
              <option value="">Not specified</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Service Date</label>
            <input type="date" className="input" value={form.serviceDate} onChange={(e) => set("serviceDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Odometer (km)</label>
            <input type="number" min="0" className="input" value={form.odometer} onChange={(e) => set("odometer", e.target.value)} />
          </div>
          <div>
            <label className="label">Service Type</label>
            <input className="input" placeholder="e.g. General Service" value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)} />
          </div>
          <div>
            <label className="label">Technician</label>
            <select className="input" value={form.technicianId} onChange={(e) => set("technicianId", e.target.value)}>
              <option value="">Not specified</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Issue Reported</label>
          <textarea className="input" rows={2} value={form.issue} onChange={(e) => set("issue", e.target.value)} />
        </div>
        <div>
          <label className="label">Parts Used</label>
          <textarea className="input" rows={2} value={form.partsUsed} onChange={(e) => set("partsUsed", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Labour Charge (₹)</label>
            <input type="number" min="0" className="input" value={form.labourCharge} onChange={(e) => set("labourCharge", e.target.value)} />
          </div>
          <div>
            <label className="label">Parts Cost (₹)</label>
            <input type="number" min="0" className="input" value={form.partsCost} onChange={(e) => set("partsCost", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Service Record"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
