import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName =
    user?.user_metadata?.full_name ?? user?.email ?? "User";

  return (
    <div className="min-h-full">
      <nav className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-xl font-extrabold text-primary">
            Zawadi
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{fullName}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
