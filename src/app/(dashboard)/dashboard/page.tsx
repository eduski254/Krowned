import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const accountType = user.user_metadata?.account_type ?? "client";
  const fullName = user.user_metadata?.full_name ?? "there";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Welcome, {fullName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        You are signed in as a <strong>{accountType}</strong>.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountType === "client" ? (
          <DashboardCard
            title="Find Services"
            description="Browse and book beauty & wellness services near you."
          />
        ) : (
          <>
            <DashboardCard
              title="My Business"
              description="Manage your business profile, services, and availability."
            />
            <DashboardCard
              title="Bookings"
              description="View and manage upcoming appointments."
            />
            <DashboardCard
              title="Analytics"
              description="Track your performance and revenue."
            />
          </>
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
