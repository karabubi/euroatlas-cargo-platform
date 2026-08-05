"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Users",
    href: "/dashboard/users",
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
  },
  {
    label: "Shipments",
    href: "/dashboard/shipments",
  },

  {
    label: "Vehicles",
    href: "/dashboard/vehicles",
  },
  {
    label: "Inspections",
    href: "/dashboard/inspections",
  },
  {
    label: "Invoices",
    href: "/dashboard/invoices",
  },
  {
    label: "Documents",
    href: "/dashboard/documents",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 flex-col bg-slate-950 text-white lg:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-xl font-bold">EuroAtlas Cargo</h1>

        <p className="mt-1 text-xs text-slate-400">Management platform</p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-sky-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
        EuroAtlas Cargo © 2026
      </div>
    </aside>
  );
}
