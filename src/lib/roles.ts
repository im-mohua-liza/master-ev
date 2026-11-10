export const ROLES = ["OWNER", "MANAGER", "SALES", "ACCOUNTANT"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner / Super Admin",
  MANAGER: "Manager",
  SALES: "Sales Executive",
  ACCOUNTANT: "Accountant",
};

export const MODULES = [
  "dashboard",
  "inventory",
  "customers",
  "leads",
  "testRides",
  "bookings",
  "sales",
  "payments",
  "suppliers",
  "expenses",
  "service",
  "reports",
  "profitLoss",
  "gst",
  "settings",
  "users",
  "auditLog",
] as const;
export type ModuleName = (typeof MODULES)[number];

// What each role can see/use. OWNER always has full access regardless of
// this table. Kept as a plain object (not DB-driven) because permissions
// are a structural decision, not day-to-day business data — but every
// user's *role* is fully editable from Settings -> User Management.
const PERMISSIONS: Record<Role, ModuleName[]> = {
  OWNER: [...MODULES],
  MANAGER: [
    "dashboard", "inventory", "customers", "leads", "testRides", "bookings",
    "sales", "payments", "suppliers", "expenses", "service", "reports",
    "profitLoss", "gst",
  ],
  SALES: [
    "dashboard", "inventory", "customers", "leads", "testRides", "bookings", "sales", "payments",
  ],
  ACCOUNTANT: [
    "dashboard", "expenses", "payments", "gst", "reports", "profitLoss",
    "customers", "sales",
  ],
};

export function canAccess(role: string, moduleName: ModuleName): boolean {
  if (role === "OWNER") return true;
  const list = PERMISSIONS[role as Role];
  return list ? list.includes(moduleName) : false;
}

export function requireRole(role: string, allowed: Role[]): boolean {
  return allowed.includes(role as Role);
}
