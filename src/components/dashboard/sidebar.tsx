"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import type { NavItem } from "./nav-config";
import { iconMap } from "./icon-map";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

// Nav items that can have badges
const BADGE_ITEMS = ["/dashboard/support", "/dashboard/admin/support"];

export function Sidebar({
  items,
  role,
  userId,
}: {
  items: NavItem[];
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
        // Apply to all support nav items
        for (const href of BADGE_ITEMS) {
          newBadges[href] = data.support;
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

  // Subscribe to Realtime for instant badge updates
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

          // Refetch counts on any new notification
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
      </nav>
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {role}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
