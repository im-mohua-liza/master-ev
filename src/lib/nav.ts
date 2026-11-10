import type { ModuleName } from "./roles";
import {
  LayoutDashboard,
  Bike,
  Users,
  Target,
  CalendarClock,
  BookMarked,
  Receipt,
  Wallet,
  Truck,
  Wrench,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: ModuleName;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" }],
  },
  {
    title: "Sales & CRM",
    items: [
      { label: "Leads", href: "/leads", icon: Target, module: "leads" },
      { label: "Test Rides", href: "/test-rides", icon: CalendarClock, module: "testRides" },
      { label: "Bookings", href: "/bookings", icon: BookMarked, module: "bookings" },
      { label: "Sales & Invoices", href: "/sales", icon: Receipt, module: "sales" },
      { label: "Customers", href: "/customers", icon: Users, module: "customers" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Scooter Models", href: "/inventory/models", icon: Bike, module: "inventory" },
      { label: "Vehicle Stock", href: "/inventory/vehicles", icon: Bike, module: "inventory" },
      { label: "Suppliers", href: "/suppliers", icon: Truck, module: "suppliers" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/payments", icon: Wallet, module: "payments" },
      { label: "Expenses", href: "/expenses", icon: Receipt, module: "expenses" },
      { label: "Profit & Loss", href: "/profit-loss", icon: TrendingUp, module: "profitLoss" },
    ],
  },
  {
    title: "Service",
    items: [{ label: "Service Records", href: "/service", icon: Wrench, module: "service" }],
  },
  {
    title: "Reports",
    items: [{ label: "Reports Center", href: "/reports", icon: BarChart3, module: "reports" }],
  },
  {
    title: "Administration",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, module: "settings" },
      { label: "Audit Log", href: "/settings/audit-log", icon: FileText, module: "auditLog" },
    ],
  },
];
