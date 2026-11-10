"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { Trash2 } from "lucide-react";

interface UserDetail {
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

export default function EditStaffPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<UserDetail | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      const u = (d.users ?? []).find((x: { id: string }) => x.id === id);
      if (u) setForm({ name: u.name, phone: u.phone ?? "", role: u.role, isActive: u.isActive });
    });
  }, [id]);

  function set<K extends keyof UserDetail>(key: K, value: UserDetail[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, phone: form.phone || undefined, newPassword: newPassword || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save changes");
      setLoading(false);
      return;
    }
    router.push("/settings/users");
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("Remove this staff account? If they have records linked, the account will be deactivated instead.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not remove account");
      return;
    }
    router.push("/settings/users");
    router.refresh();
  }

  if (!form) return <div className="text-sm text-slate-500">Loading...</div>;

  return (
    <div className="max-w-md">
      <PageHeader title="Edit Staff Account" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          <label htmlFor="isActive" className="text-sm text-slate-700">Account is active</label>
        </div>
        <div>
          <label className="label">Reset Password (optional)</label>
          <input type="password" className="input" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Changes"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="button" onClick={onDelete} className="btn-ghost text-red-600 ml-auto"><Trash2 size={14} /> Remove</button>
        </div>
      </form>
    </div>
  );
}
