"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ModelOption { id: string; brand: string; model: string; variant: string | null }
interface UserOption { id: string; name: string; isActive: boolean }

export interface TestRideFormData {
  customerName: string;
  phone: string;
  modelId: string;
  vehicleNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  salespersonId: string;
  status: string;
  feedback: string;
}

const EMPTY: TestRideFormData = {
  customerName: "", phone: "", modelId: "", vehicleNumber: "",
  scheduledDate: new Date().toISOString().slice(0, 10), scheduledTime: "",
  salespersonId: "", status: "SCHEDULED", feedback: "",
};

export function TestRideForm({ initial, testRideId }: { initial?: Partial<TestRideFormData>; testRideId?: string }) {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState<TestRideFormData>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicle-models?activeOnly=1").then((r) => r.json()).then((d) => setModels(d.models ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers((d.users ?? []).filter((u: UserOption) => u.isActive)));
  }, []);

  function set<K extends keyof TestRideFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = testRideId ? `/api/test-rides/${testRideId}` : "/api/test-rides";
    const res = await fetch(url, {
      method: testRideId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save test ride");
      setLoading(false);
      return;
    }
    router.push("/test-rides");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Customer Name</label>
          <input className="input" required value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Scooter Model</label>
          <select className="input" required value={form.modelId} onChange={(e) => set("modelId", e.target.value)}>
            <option value="">Select model</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.variant}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Vehicle Number (demo unit)</label>
          <input className="input" value={form.vehicleNumber} onChange={(e) => set("vehicleNumber", e.target.value)} />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" required value={form.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
        </div>
        <div>
          <label className="label">Time</label>
          <input type="time" className="input" value={form.scheduledTime} onChange={(e) => set("scheduledTime", e.target.value)} />
        </div>
        <div>
          <label className="label">Sales Executive</label>
          <select className="input" value={form.salespersonId} onChange={(e) => set("salespersonId", e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Customer Feedback</label>
        <textarea className="input" rows={2} value={form.feedback} onChange={(e) => set("feedback", e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Test Ride"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
