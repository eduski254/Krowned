import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { AvatarDropdown } from "./avatar-dropdown";
import type { NavGroup } from "./nav-config";

export function Topbar({
  userId,
  userName,
  avatarUrl,
  navGroups,
}: {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  navGroups: NavGroup[];
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4 pt-[env(safe-area-inset-top)] sm:h-16 sm:px-6">
      <div className="flex items-center gap-1">
        <MobileNav groups={navGroups} userId={userId} />
        <Link
          href="/"
          className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Visit site
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell userId={userId} />
        <AvatarDropdown userName={userName} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
