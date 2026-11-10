"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ModelOption { id: string; brand: string; model: string; variant: string | null }
interface UserOption { id: string; name: string; isActive: boolean }

export const LEAD_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "TEST_RIDE", "NEGOTIATION", "BOOKED", "SOLD", "LOST"];
export const LEAD_SOURCES = ["Walk-in", "Phone", "Referral", "Social Media", "Website", "Other"];

export interface LeadFormData {
  name: string;
  phone: string;
  interestedModelId: string;
  budget: string;
  source: string;
  assignedToId: string;
  followUpDate: string;
  status: string;
  notes: string;
}

const EMPTY: LeadFormData = {
  name: "", phone: "", interestedModelId: "", budget: "", source: "Walk-in",
  assignedToId: "", followUpDate: "", status: "NEW", notes: "",
};

export function LeadForm({ initial, leadId }: { initial?: Partial<LeadFormData>; leadId?: string }) {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState<LeadFormData>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicle-models?activeOnly=1").then((r) => r.json()).then((d) => setModels(d.models ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers((d.users ?? []).filter((u: UserOption) => u.isActive)));
  }, []);

  function set<K extends keyof LeadFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = leadId ? `/api/leads/${leadId}` : "/api/leads";
    const res = await fetch(url, {
      method: leadId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save lead");
      setLoading(false);
      return;
    }
    router.push("/leads");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Lead Name</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Interested Model</label>
          <select className="input" value={form.interestedModelId} onChange={(e) => set("interestedModelId", e.target.value)}>
            <option value="">Not specified</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.variant}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Budget (₹)</label>
          <input type="number" min="0" className="input" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" value={form.source} onChange={(e) => set("source", e.target.value)}>
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Assigned To</label>
          <select className="input" value={form.assignedToId} onChange={(e) => set("assignedToId", e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Follow-up Date</label>
          <input type="date" className="input" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Lead"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
