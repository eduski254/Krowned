import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { logoutAction } from "@/app/(auth)/actions";
import type { NavItem } from "./nav-config";

export function Topbar({
  userId,
  userName,
  avatarUrl,
  navItems,
}: {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  navItems: NavItem[];
}) {
  const initial = (userName || "?").charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <MobileNav items={navItems} userId={userId} />
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <NotificationBell userId={userId} />
        <ThemeToggle />
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initial}
            </div>
          )}
          <span className="hidden text-sm font-medium text-foreground sm:block">
            {userName}
          </span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
