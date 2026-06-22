"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function Sidebar({
  items,
  role,
}: {
  items: NavItem[];
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="text-xl font-heading font-extrabold text-primary">
          Zawadi
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/dashboard/business" &&
                item.href !== "/dashboard/staff" &&
                item.href !== "/dashboard/admin" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border px-3 py-3">
        <span className="block px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {role}
        </span>
      </div>
    </aside>
  );
}
