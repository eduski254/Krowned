import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StaffProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, display_name, title, bio, avatar_url")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!staffRow) redirect("/dashboard/staff");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Staff Profile
      </h1>

      <div className="max-w-xl rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          {staffRow.avatar_url ? (
            <img
              src={staffRow.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(staffRow.display_name ?? "?").charAt(0)}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-foreground">
              {staffRow.display_name}
            </p>
            {staffRow.title && (
              <p className="text-sm text-muted-foreground">{staffRow.title}</p>
            )}
          </div>
        </div>

        {staffRow.bio && (
          <div>
            <h3 className="text-sm font-medium text-foreground">Bio</h3>
            <p className="mt-1 text-sm text-muted-foreground">{staffRow.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
