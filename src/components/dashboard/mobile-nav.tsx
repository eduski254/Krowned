"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import type { NavGroup } from "./nav-config";
import { iconMap } from "./icon-map";

const BADGE_ITEMS = ["/dashboard/support", "/dashboard/admin/support"];
const BOOKING_BADGE_ITEMS = ["/dashboard/business/calendar"];

const ROOT_HREFS = [
  "/dashboard",
  "/dashboard/business",
  "/dashboard/staff",
  "/dashboard/admin",
];

export function MobileNav({
  groups,
  userId,
}: {
  groups: NavGroup[];
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

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted border border-border"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Solid backdrop — fixes the transparent bug at ~768px */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setOpen(false)}
              >
                <img
                  src="/brand/logo-white.png"
                  alt="Krowned"
                  className="h-7 w-auto dark:block hidden"
                />
                <img
                  src="/brand/logo-black.png"
                  alt="Krowned"
                  className="h-7 w-auto dark:hidden block"
                />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="overflow-y-auto px-3 py-4">
              {groups.map((group, gi) => (
                <div key={gi}>
                  {gi > 0 && <div className="my-3 border-t border-border" />}
                  {group.label && (
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (!ROOT_HREFS.includes(item.href) &&
                          pathname.startsWith(item.href));
                      const Icon = iconMap[item.icon];
                      const badgeCount = badges[item.href] ?? 0;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={clsx(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
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
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
