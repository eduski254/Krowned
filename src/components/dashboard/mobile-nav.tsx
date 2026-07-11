"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Menu, X, Compass, Info, Briefcase } from "lucide-react";
import type { NavItem } from "./nav-config";
import { iconMap } from "./icon-map";

const PUBLIC_LINKS = [
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/how-it-works", label: "How it Works", Icon: Info },
  { href: "/for-professionals", label: "For Professionals", Icon: Briefcase },
];

const BADGE_ITEMS = ["/dashboard/support", "/dashboard/admin/support"];
const BOOKING_BADGE_ITEMS = ["/dashboard/business/calendar"];

export function MobileNav({
  items,
  userId,
}: {
  items: NavItem[];
  userId?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/counts");
      if (!res.ok) return;
      const data = await res.json();
      const newBadges: Record<string, number> = {};
      if (data.support > 0) {
        for (const href of BADGE_ITEMS) {
          newBadges[href] = data.support;
        }
      }
      if (data.bookings > 0) {
        for (const href of BOOKING_BADGE_ITEMS) {
          newBadges[href] = data.bookings;
        }
      }
      setBadges(newBadges);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/20"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Link
                href="/"
                className="text-xl font-heading font-extrabold text-primary"
                onClick={() => setOpen(false)}
              >
                Zawadi
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="overflow-y-auto px-3 py-4">
              {/* Public navigation */}
              <ul className="space-y-1">
                {PUBLIC_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <link.Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-3 border-t border-border" />

              {/* Dashboard navigation */}
              <ul className="space-y-1">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/dashboard/business" &&
                      item.href !== "/dashboard/staff" &&
                      item.href !== "/dashboard/admin" &&
                      pathname.startsWith(item.href));
                  const Icon = iconMap[item.icon];
                  const badgeCount = badges[item.href] ?? 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                        <span className="flex-1">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
