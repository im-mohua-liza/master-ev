import Link from "next/link";
import { auth } from "@/auth";
import { PageHeader } from "@/components/data-table-shell";
import { Building2, Users, Tag, Database, FileText, Receipt } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const isOwner = session?.user.role === "OWNER";

  const sections = [
    { label: "Business Profile", desc: "Business name, address, GSTIN, PAN, bank & UPI details", href: "/settings/business", icon: Building2, ownerOnly: false },
    { label: "Invoice & GST Settings", desc: "Invoice numbering format and financial year", href: "/settings/business", icon: Receipt, ownerOnly: false },
    { label: "User Management", desc: "Add, edit, deactivate staff accounts and roles", href: "/settings/users", icon: Users, ownerOnly: true },
    { label: "Expense Categories", desc: "Manage the categories used in Expenses", href: "/settings/expense-categories", icon: Tag, ownerOnly: false },
    { label: "Audit Log", desc: "Track every important change made in the system", href: "/settings/audit-log", icon: FileText, ownerOnly: false },
    { label: "Demo Data", desc: "Load or remove sample data for exploration", href: "/settings/demo-data", icon: Database, ownerOnly: true },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your business — no developer needed" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections
          .filter((s) => !s.ownerOnly || isOwner)
          .map((s) => (
            <Link key={s.label} href={s.href} className="card p-5 hover:border-emerald-300 transition-colors">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 mb-3">
                <s.icon size={18} />
              </div>
              <div className="font-semibold text-slate-900 text-sm">{s.label}</div>
              <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
            </Link>
          ))}
      </div>
    </div>
  );
}
