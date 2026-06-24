import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "./mobile-nav";
import { logoutAction } from "@/app/(auth)/actions";
import { Bell } from "lucide-react";
import type { NavItem } from "./nav-config";

export function Topbar({
  userName,
  navItems,
}: {
  userName: string;
  navItems: NavItem[];
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <MobileNav items={navItems} />
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <Bell className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <span className="hidden text-sm font-medium text-foreground sm:block">
          {userName}
        </span>
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
