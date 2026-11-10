import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "emerald" | "red" | "amber" | "blue" | "slate";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{value}</div>
          {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
