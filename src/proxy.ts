import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccess, type ModuleName } from "@/lib/roles";

const PUBLIC_PATHS = ["/login", "/bootstrap"];

// Ordered most-specific-first: the first matching prefix wins.
const PATH_MODULE_RULES: { prefix: string; module: ModuleName }[] = [
  { prefix: "/settings/users", module: "users" },
  { prefix: "/settings/audit-log", module: "auditLog" },
  { prefix: "/settings", module: "settings" },
  { prefix: "/dashboard", module: "dashboard" },
  { prefix: "/inventory", module: "inventory" },
  { prefix: "/suppliers", module: "suppliers" },
  { prefix: "/customers", module: "customers" },
  { prefix: "/leads", module: "leads" },
  { prefix: "/test-rides", module: "testRides" },
  { prefix: "/bookings", module: "bookings" },
  { prefix: "/sales", module: "sales" },
  { prefix: "/payments", module: "payments" },
  { prefix: "/expenses", module: "expenses" },
  { prefix: "/service", module: "service" },
  { prefix: "/reports", module: "reports" },
  { prefix: "/profit-loss", module: "profitLoss" },
];

function moduleForPath(pathname: string): ModuleName | null {
  const rule = PATH_MODULE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return rule?.module ?? null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/bootstrap");

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const module = moduleForPath(pathname);
  if (module && !canAccess(req.auth.user.role, module)) {
    const deniedUrl = new URL("/dashboard", req.nextUrl.origin);
    deniedUrl.searchParams.set("denied", "1");
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
