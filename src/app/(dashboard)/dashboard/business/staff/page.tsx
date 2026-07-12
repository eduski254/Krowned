import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Users, Plus, Mail } from "lucide-react";
import Link from "next/link";

export default async function BusinessStaffPage() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  const { data: staffMembers } = await admin
    .from("staff")
    .select("id, display_name, title, status, invited_email, avatar_url, user_id")
    .eq("business_id", business.id)
    .order("display_name");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Staff</h1>
        <Link
          href="/dashboard/business/staff/invite"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Invite Staff
        </Link>
      </div>

      {staffMembers && staffMembers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffMembers.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/business/staff/${s.id}`}
              className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {s.avatar_url ? (
                  <img
                    src={s.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {(s.display_name ?? "?").charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {s.display_name ?? s.invited_email}
                  </p>
                  {s.title && (
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "active"
                      ? "bg-success/10 text-success"
                      : s.status === "invited"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.status}
                </span>
                {s.status === "invited" && (
                  <Mail className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No staff members"
          description="Invite your team to help manage bookings and schedules."
          action={
            <Link
              href="/dashboard/business/staff/invite"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Invite Staff
            </Link>
          }
        />
      )}
    </div>
  );
}
