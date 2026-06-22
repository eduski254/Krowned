import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Clock } from "lucide-react";
import { WeeklySlotForm } from "./weekly-slot-form";
import { ExceptionForm } from "./exception-form";
import { removeWeeklySlot, removeException } from "./actions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function StaffSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!staffRow) redirect("/dashboard/staff");

  const { data: schedules } = await supabase
    .from("staff_schedules")
    .select("id, day_of_week, start_time, end_time")
    .eq("staff_id", staffRow.id)
    .order("day_of_week");

  const { data: exceptions } = await supabase
    .from("schedule_exceptions")
    .select("id, starts_at, ends_at, reason, is_available")
    .eq("staff_id", staffRow.id)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(20);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Schedule</h1>

      <div className="max-w-2xl space-y-8">
        {/* Weekly recurring schedule */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Weekly Availability
          </h2>
          {schedules && schedules.length > 0 ? (
            <div className="mb-4 space-y-2">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <span className="font-medium text-foreground">
                    {DAY_NAMES[s.day_of_week]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {s.start_time?.slice(0, 5)} — {s.end_time?.slice(0, 5)}
                    </span>
                    <form action={removeWeeklySlot}>
                      <input type="hidden" name="slot_id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <EmptyState
                icon={Clock}
                title="No schedule set"
                description="Set your weekly working hours so clients can book with you."
              />
            </div>
          )}
          <WeeklySlotForm />
        </section>

        {/* Exceptions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Time Off &amp; Blocks
          </h2>
          {exceptions && exceptions.length > 0 ? (
            <div className="mb-4 space-y-2">
              {exceptions.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {e.reason || (e.is_available ? "Extra availability" : "Blocked")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.starts_at).toLocaleDateString()} —{" "}
                      {new Date(e.ends_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.is_available
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {e.is_available ? "Available" : "Blocked"}
                    </span>
                    <form action={removeException}>
                      <input type="hidden" name="exception_id" value={e.id} />
                      <button
                        type="submit"
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              No upcoming time off or schedule blocks.
            </p>
          )}
          <ExceptionForm />
        </section>
      </div>
    </div>
  );
}
