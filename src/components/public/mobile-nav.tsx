"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/how-it-works", label: "How it Works" },
  { href: "/for-professionals", label: "For Professionals" },
  { href: "/blog", label: "Blog" },
];

export function PublicMobileNav({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[57px] z-50 border-b border-border bg-background shadow-lg">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}

            <hr className="my-2 border-border" />

            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {userName ?? "Dashboard"}
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
