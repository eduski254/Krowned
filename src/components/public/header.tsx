import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { PublicMobileNav } from "./mobile-nav";
import { logoutAction } from "@/app/(auth)/actions";

const NAV_LINKS = [
  { href: "/explore", label: "Find a stylist" },
  { href: "/styles", label: "Styles" },
  { href: "/for-stylists", label: "For stylists" },
  { href: "/blog", label: "Blog" },
  { href: "/our-story", label: "Our story" },
];

export async function PublicHeader() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  const initial = (fullName || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
      <div className="flex items-center px-4 py-3 sm:px-8 md:px-10 lg:px-[clamp(28px,4.2vw,60px)]">
        {/* Left: logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo-white.png"
            alt="Krowned"
            width={120}
            height={32}
            className="h-7 w-auto hidden dark:block"
            priority
          />
          <Image
            src="/brand/logo-black.png"
            alt="Krowned"
            width={120}
            height={32}
            className="h-7 w-auto block dark:hidden"
            priority
          />
        </Link>

        {/* Right: nav + actions */}
        <div className="ml-auto hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${isActive ? "text-foreground underline underline-offset-4 decoration-2 decoration-primary" : "text-muted-foreground hover:text-foreground dark:text-white"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="h-5 w-px bg-border" />
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initial}
                  </div>
                )}
                {fullName ?? "Dashboard"}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <PublicMobileNav isLoggedIn={!!user} userName={fullName} />
        </div>
      </div>
    </header>
  );
}
