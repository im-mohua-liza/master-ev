"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary">
          <Plus size={16} /> {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="input pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function StatusBadge({ status, tone }: { status: string; tone: "green" | "yellow" | "red" | "slate" | "blue" }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`badge ${tones[tone]}`}>{status.replaceAll("_", " ")}</span>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-12 text-sm text-slate-500">{message}</div>;
}
