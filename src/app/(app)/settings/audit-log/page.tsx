import { prisma } from "@/lib/prisma";
import { PageHeader, StatusBadge } from "@/components/data-table-shell";

const TONE: Record<string, "green" | "yellow" | "red" | "slate" | "blue"> = {
  CREATE: "green", UPDATE: "blue", DELETE: "red", CANCEL: "yellow", LOGIN: "slate", LOGOUT: "slate",
};

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every important change made in the system, for accountability" />
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td>{l.userName}</td>
                <td><StatusBadge status={l.action} tone={TONE[l.action] ?? "slate"} /></td>
                <td>{l.entityType}</td>
                <td className="whitespace-normal max-w-md">{l.description}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
