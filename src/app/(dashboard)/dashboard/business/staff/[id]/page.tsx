import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { removeStaff } from "../actions";
import { removeWeeklySlotForStaff } from "../../../staff/schedule/actions";
import { StaffScheduleForm } from "./schedule-form";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) redirect("/dashboard/business");

  const { data: staffMember } = await supabase
    .from("staff")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!staffMember) notFound();

  const [staffServicesRes, schedulesRes] = await Promise.all([
    supabase
      .from("staff_services")
      .select("service_id, services(name)")
      .eq("staff_id", id),
    supabase
      .from("staff_schedules")
      .select("id, day_of_week, start_time, end_time")
      .eq("staff_id", id)
      .order("day_of_week"),
  ]);

  const staffServices = staffServicesRes.data;
  const schedules = schedulesRes.data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Staff Details</h1>

      <div className="max-w-xl space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            {staffMember.avatar_url ? (
              <img
                src={staffMember.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {(staffMember.display_name ?? "?").charAt(0)}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-foreground">
                {staffMember.display_name}
              </p>
              {staffMember.title && (
                <p className="text-muted-foreground">{staffMember.title}</p>
              )}
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  staffMember.status === "active"
                    ? "bg-success/10 text-success"
                    : staffMember.status === "invited"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {staffMember.status}
              </span>
            </div>
          </div>
          {staffMember.invited_email && (
            <p className="mt-4 text-sm text-muted-foreground">
              Email: {staffMember.invited_email}
            </p>
          )}
          {staffMember.bio && (
            <p className="mt-2 text-sm text-foreground">{staffMember.bio}</p>
          )}
        </div>

        {/* Assigned services */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Assigned Services
          </h2>
          {staffServices && staffServices.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {staffServices.map((ss) => (
                <li key={ss.service_id} className="text-sm text-foreground">
                  {(ss.services as unknown as { name: string } | null)?.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No services assigned yet. Assign services from the service edit page.
            </p>
          )}
        </div>

        {/* Schedule — now with management */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Schedule</h2>
          {schedules && schedules.length > 0 ? (
            <div className="mt-3 space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {DAY_NAMES[s.day_of_week]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground">
                      {s.start_time?.slice(0, 5)} — {s.end_time?.slice(0, 5)}
                    </span>
                    <form action={removeWeeklySlotForStaff}>
                      <input type="hidden" name="slot_id" value={s.id} />
                      <input type="hidden" name="staff_id" value={id} />
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
            <p className="mt-2 text-sm text-muted-foreground">
              No schedule set.
            </p>
          )}
          <StaffScheduleForm staffId={id} />
        </div>

        {/* Remove */}
        {staffMember.status !== "inactive" && (
          <form action={removeStaff}>
            <input type="hidden" name="staff_id" value={id} />
            <button
              type="submit"
              className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              Deactivate staff member
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
