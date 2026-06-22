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

  const role = await getUserRole(supabase, user.id);
  const navItems = navMap[role];
  const fullName =
    user.user_metadata?.full_name ?? user.email ?? "User";

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar items={navItems} role={roleLabels[role]} />
      <div className="flex flex-1 flex-col">
        <Topbar userName={fullName} navItems={navItems} />
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
