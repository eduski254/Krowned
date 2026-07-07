import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import {
  clientNav,
  businessNav,
  staffNav,
  adminNav,
} from "@/components/dashboard/nav-config";
import { IdleTimeout } from "@/components/idle-timeout";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { getImpersonatedUserId } from "@/lib/impersonate";
import type { AppRole } from "@/lib/roles";

const navMap: Record<AppRole, typeof clientNav> = {
  client: clientNav,
  business_owner: businessNav,
  staff: staffNav,
  super_admin: adminNav,
};

const roleLabels: Record<AppRole, string> = {
  client: "Client",
  business_owner: "Business Owner",
  staff: "Staff",
  super_admin: "Super Admin",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check for impersonation
  const impersonateId = await getImpersonatedUserId();
  let isImpersonating = false;
  let effectiveUserId = user.id;

  if (impersonateId && impersonateId !== user.id) {
    // Verify caller is actually a super admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.platform_role === "super_admin") {
      isImpersonating = true;
      effectiveUserId = impersonateId;
    }
  }

  const [role, profileRes] = await Promise.all([
    getUserRole(supabase, effectiveUserId),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", effectiveUserId)
      .single(),
  ]);

  const navItems = navMap[role];
  const fullName =
    profileRes.data?.full_name ??
    (isImpersonating ? "Unknown User" : (user.user_metadata?.full_name ?? user.email ?? "User"));

  return (
    <div className="flex h-full min-h-screen flex-col">
      {isImpersonating && (
        <ImpersonationBanner targetName={fullName} targetRole={roleLabels[role]} />
      )}
      <div className="flex flex-1">
        <IdleTimeout />
        <Sidebar items={navItems} role={roleLabels[role]} userId={effectiveUserId} />
        <div className="flex flex-1 flex-col">
          <Topbar
            userId={effectiveUserId}
            userName={fullName}
            avatarUrl={profileRes.data?.avatar_url}
            navItems={navItems}
          />
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
