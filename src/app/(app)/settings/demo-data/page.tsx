"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";
import { Database, AlertTriangle } from "lucide-react";

export default function DemoDataPage() {
  const router = useRouter();
  const [seeded, setSeeded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings/business").then((r) => r.json()).then((d) => setSeeded(d.profile?.demoDataSeeded ?? false));
  }, []);

  async function onSeed() {
    setLoading(true);
    await fetch("/api/settings/demo-data", { method: "POST" });
    setLoading(false);
    setSeeded(true);
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("This will permanently delete all sample scooters, customers, sales and expenses. Continue?")) return;
    setLoading(true);
    await fetch("/api/settings/demo-data", { method: "DELETE" });
    setLoading(false);
    setSeeded(false);
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Demo Data" subtitle="Explore the system with realistic sample data" />
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Database className="text-emerald-600 mt-0.5" size={20} />
          <div className="text-sm text-slate-600">
            Loads a handful of sample scooter models, a couple of suppliers, customers,
            vehicles, sales and expenses so you can see the system in action before going
            live. All sample records are clearly tagged and can be removed in one click.
          </div>
        </div>

        {seeded && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5" />
            Demo data is currently loaded. Remove it before you start recording real business
            transactions.
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onSeed} disabled={loading || !!seeded} className="btn-primary">
            {loading ? "Working..." : "Load Demo Data"}
          </button>
          <button onClick={onDelete} disabled={loading || !seeded} className="btn-danger">
            {loading ? "Working..." : "Delete Demo Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
