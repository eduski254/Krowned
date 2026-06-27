import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      {/* Left: gradient brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <Link href="/" className="text-4xl font-extrabold tracking-tight hover:opacity-90 transition-opacity">
            Zawadi
          </Link>
          <p className="mt-4 text-lg opacity-90">
            Discover and book top beauty &amp; wellness professionals near you.
          </p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <Link
          href="/"
          className="absolute left-6 top-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Home
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
