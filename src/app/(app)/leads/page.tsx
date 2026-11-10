"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, StatusBadge, EmptyState } from "@/components/data-table-shell";
import { LEAD_STATUSES } from "@/components/lead-form";
import { formatINR } from "@/lib/money";

interface LeadRow {
  id: string;
  leadCode: string;
  name: string;
  phone: string;
  budget: number | null;
  status: string;
  followUpDate: string | null;
  source: string | null;
  interestedModel: { brand: string; model: string } | null;
  assignedTo: { name: string } | null;
}

const TONE: Record<string, "green" | "yellow" | "red" | "slate" | "blue"> = {
  NEW: "blue", CONTACTED: "blue", INTERESTED: "yellow", TEST_RIDE: "yellow",
  NEGOTIATION: "yellow", BOOKED: "green", SOLD: "green", LOST: "red",
};

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Leads" subtitle="Prospective customers & follow-ups" actionLabel="Add Lead" actionHref="/leads/new" />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, phone..." />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Lead</th><th>Phone</th><th>Interested Model</th><th>Budget</th><th>Source</th><th>Assigned To</th><th>Follow-up</th><th>Status</th></tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}/edit`} className="font-medium text-emerald-700 hover:underline">{l.name}</Link></td>
                <td>{l.phone}</td>
                <td>{l.interestedModel ? `${l.interestedModel.brand} ${l.interestedModel.model}` : "—"}</td>
                <td>{l.budget ? formatINR(l.budget) : "—"}</td>
                <td>{l.source ?? "—"}</td>
                <td>{l.assignedTo?.name ?? "—"}</td>
                <td className={isOverdue(l.followUpDate) ? "text-red-600 font-medium" : ""}>
                  {l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-IN") : "—"}
                </td>
                <td><StatusBadge status={l.status} tone={TONE[l.status] ?? "slate"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && leads.length === 0 && <EmptyState message="No leads yet. Add your first lead to start tracking prospects." />}
      </div>
    </div>
  );
}
