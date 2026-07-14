"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Home,
  Calendar,
  Search,
  Heart,
  User,
  Scissors,
  Users,
  LayoutGrid,
  Building2,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const CLIENT_TABS: Tab[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

const BUSINESS_TABS: Tab[] = [
  { label: "Home", href: "/dashboard/business", icon: Home },
  { label: "Calendar", href: "/dashboard/business/calendar", icon: Calendar },
  { label: "Services", href: "/dashboard/business/services", icon: Scissors },
  { label: "Staff", href: "/dashboard/business/staff", icon: Users },
  { label: "Profile", href: "/dashboard/business/profile", icon: Building2 },
];

const STAFF_TABS: Tab[] = [
  { label: "Home", href: "/dashboard/staff", icon: Home },
  { label: "Schedule", href: "/dashboard/staff/schedule", icon: Clock },
  { label: "Clients", href: "/dashboard/staff/clients", icon: Users },
  { label: "Earnings", href: "/dashboard/staff/earnings", icon: Home },
  { label: "Profile", href: "/dashboard/staff/profile", icon: User },
];

const ADMIN_TABS: Tab[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutGrid },
  { label: "Businesses", href: "/dashboard/admin/businesses", icon: Building2 },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Bookings", href: "/dashboard/admin/bookings", icon: Calendar },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

const TAB_MAP: Record<string, Tab[]> = {
  Client: CLIENT_TABS,
  "Business Owner": BUSINESS_TABS,
  Staff: STAFF_TABS,
  "Super Admin": ADMIN_TABS,
};

export function BottomTabBar({ role }: { role: string }) {
  const pathname = usePathname();
  const tabs = TAB_MAP[role] ?? CLIENT_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" &&
              tab.href !== "/dashboard/business" &&
              tab.href !== "/dashboard/staff" &&
              tab.href !== "/dashboard/admin" &&
              tab.href !== "/explore" &&
              pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              <tab.icon
                className={clsx(
                  "h-5 w-5",
                  isActive && "stroke-[2.5px]",
                )}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
