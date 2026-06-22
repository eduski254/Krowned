import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-heading font-extrabold text-primary">
          Zawadi
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Explore
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            How it Works
          </Link>
          <Link href="/for-professionals" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            For Professionals
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
