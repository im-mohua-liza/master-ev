"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";
import { ROLES, ROLE_LABELS } from "@/lib/roles";

export default function NewStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "SALES" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create account");
      setLoading(false);
      return;
    }
    router.push("/settings/users");
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Add Staff Account" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
            {ROLES.filter((r) => r !== "OWNER").map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Temporary Password</label>
          <input type="password" className="input" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
          <p className="text-xs text-slate-500 mt-1">Share this with the staff member. They can be given a new one anytime from here.</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Creating..." : "Create Account"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
