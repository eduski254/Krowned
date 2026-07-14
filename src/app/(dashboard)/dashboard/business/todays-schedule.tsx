"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { clsx } from "clsx";
import { EmptyState } from "@/components/dashboard/empty-state";
import { createClient } from "@/lib/supabase/client";

interface ScheduleItem {
  id: string;
  starts_at: string;
  status: string;
  serviceName: string;
  staffName: string;
  clientName: string;
}

function formatTime(utc: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(utc));
}

export function TodaysSchedule({
  businessId,
  timezone,
  initialItems,
}: {
  businessId: string;
  timezone: string;
  initialItems: ScheduleItem[];
}) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    // Get today's date boundaries in UTC
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const channel = supabase
      .channel(`today-schedule:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            starts_at: string;
            status: string;
            service_id: string;
            staff_id: string | null;
            client_id: string | null;
            contact_id: string | null;
          };

          // Only care about today's bookings
          const startsAt = new Date(row.starts_at);
          if (startsAt < todayStart || startsAt >= todayEnd) return;

          const [svcRes, staffRes, clientRes, contactRes] = await Promise.all([
            supabase.from("services").select("name").eq("id", row.service_id).single(),
            row.staff_id
              ? supabase.from("staff").select("display_name").eq("id", row.staff_id).single()
              : Promise.resolve({ data: null }),
            row.client_id
              ? supabase.from("profiles").select("full_name").eq("id", row.client_id).single()
              : Promise.resolve({ data: null }),
            row.contact_id
              ? supabase.from("business_contacts").select("name").eq("id", row.contact_id).single()
              : Promise.resolve({ data: null }),
          ]);

          const newItem: ScheduleItem = {
            id: row.id,
            starts_at: row.starts_at,
            status: row.status,
            serviceName: svcRes.data?.name ?? "Service",
            staffName: (staffRes.data as any)?.display_name ?? "Unassigned",
            clientName:
              (clientRes.data as any)?.full_name ??
              (contactRes.data as any)?.name ??
              "Client",
          };

          setItems((prev) => {
            if (prev.some((b) => b.id === newItem.id)) return prev;
            return [...prev, newItem].sort(
              (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
            );
          });

          setNewIds((prev) => new Set(prev).add(row.id));
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(row.id);
              return next;
            });
          }, 5000);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          setItems((prev) =>
            prev.map((b) => (b.id === row.id ? { ...b, status: row.status } : b)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Today&apos;s Schedule
      </h2>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((b) => (
            <div
              key={b.id}
              className={clsx(
                "flex items-center justify-between rounded-xl border bg-card p-4 transition-all duration-500",
                newIds.has(b.id)
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2"
                  : "border-border",
              )}
            >
              <div>
                <p className="font-medium text-foreground">{b.serviceName}</p>
                <p className="text-sm text-muted-foreground">
                  {b.staffName} — {b.clientName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {formatTime(b.starts_at, timezone)}
                </p>
                <span
                  className={clsx(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    b.status === "confirmed"
                      ? "bg-success/10 text-success"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No bookings today"
          description="Your schedule for today is clear."
        />
      )}
    </>
  );
}
