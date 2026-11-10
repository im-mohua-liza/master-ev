"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/data-table-shell";
import { ROLE_LABELS } from "@/lib/roles";
import { Plus } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="User Management" subtitle="Staff accounts and roles" />
      <div className="mb-4">
        <Link href="/settings/users/new" className="btn-primary"><Plus size={16} /> Add Staff Account</Link>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone ?? "—"}</td>
                <td>{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</td>
                <td>
                  <span className={`badge ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td><Link href={`/settings/users/${u.id}/edit`} className="text-emerald-700 hover:underline text-sm">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && <EmptyState message="No staff accounts yet." />}
      </div>
    </div>
  );
}
