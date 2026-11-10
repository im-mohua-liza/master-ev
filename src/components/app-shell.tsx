"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, Plus, ChevronDown } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";
import { canAccess, ROLE_LABELS, type ModuleName } from "@/lib/roles";
import clsx from "clsx";

const QUICK_ACTIONS = [
  { label: "New Sale", href: "/sales/new" },
  { label: "Add Vehicle", href: "/inventory/vehicles/new" },
  { label: "Add Customer", href: "/customers/new" },
  { label: "New Booking", href: "/bookings/new" },
  { label: "Add Expense", href: "/expenses/new" },
  { label: "Add Lead", href: "/leads/new" },
  { label: "Schedule Test Ride", href: "/test-rides/new" },
  { label: "Record Payment", href: "/payments/new" },
];

export function AppShell({
  children,
  businessName,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  businessName: string;
  userName: string;
  userRole: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const pathname = usePathname();

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => canAccess(userRole, i.module as ModuleName)),
  })).filter((g) => g.items.length > 0);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white">
          {businessInitials(businessName)}
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">{businessName}</div>
          <div className="text-[11px] text-slate-400">EV Showroom</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.title || "root"}>
            {group.title && (
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800 px-4 py-3">
        <div className="text-xs text-slate-400 mb-2">
          {userName} · {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-slate-900">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
          <button className="lg:hidden text-slate-600" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block text-sm text-slate-500">
            {businessName} · EV Showroom Management System
          </div>
          <div className="relative ml-auto">
            <button
              onClick={() => setQuickOpen((v) => !v)}
              className="btn-primary text-sm"
            >
              <Plus size={16} /> Quick Action <ChevronDown size={14} />
            </button>
            {quickOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setQuickOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {QUICK_ACTIONS.map((qa) => (
                    <Link
                      key={qa.href}
                      href={qa.href}
                      onClick={() => setQuickOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {qa.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}

function businessInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "EV";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
