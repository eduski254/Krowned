import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 sm:px-12">
        <span className="text-xl font-extrabold text-primary">Zawadi</span>
        <div className="flex items-center gap-3">
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
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Beauty &amp; wellness,{" "}
          <span className="text-primary">booked effortlessly</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          Discover top professionals near you. Book appointments in seconds.
          Grow your business with Zawadi.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Get started free
          </Link>
          <Link
            href="/signup?type=professional"
            className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            List your business
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        Zawadi &mdash; Beauty &amp; Wellness Marketplace
      </footer>
    </div>
  );
}
