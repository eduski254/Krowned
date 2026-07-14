"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import type { NavGroup } from "./nav-config";
import { iconMap } from "./icon-map";
import { createClient } from "@/lib/supabase/client";

const BADGE_ITEMS = ["/dashboard/support", "/dashboard/admin/support"];
const BOOKING_BADGE_ITEMS = ["/dashboard/business/calendar"];

const ROOT_HREFS = [
  "/dashboard",
  "/dashboard/business",
  "/dashboard/staff",
  "/dashboard/admin",
];

export function Sidebar({
  groups,
  role,
  userId,
}: {
  groups: NavGroup[];
  role: string;
  userId?: string;
}) {
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
    const interval = setInterval(fetchCounts, 30_000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`sidebar-badges:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { type: string };
          if (row.type === "last_bell_read") return;
          fetchCounts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCounts]);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center">
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
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <div className="px-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>
    </aside>
  );
}
