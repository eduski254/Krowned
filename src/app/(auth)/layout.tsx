import Link from "next/link";

// REVIEW: Replace with a real licensed image before launch.
// Swap this single constant to change the auth panel background.
const AUTH_HERO_IMAGE = "/brand/styles-man.webp";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      {/* Left: image + gradient overlay brand panel (hidden on mobile) */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        {/* Background image */}
        <img
          src={AUTH_HERO_IMAGE}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Brand gradient overlay at ~35% opacity */}
        <div className="absolute inset-0 bg-gradient-hero opacity-65" />
        {/* Extra scrim for text legibility */}
        <div className="absolute inset-0 bg-black/15" />

        {/* Text content — bottom-left aligned */}
        <div className="absolute bottom-12 left-12 z-10 max-w-sm text-left text-white">
          <Link href="/" className="hover:opacity-90 transition-opacity inline-block">
            <img
              src="/brand/logo-white.png"
              alt="Krowned"
              className="h-10 w-auto drop-shadow-md"
            />
          </Link>
          <p className="mt-3 text-xs text-white/60 drop-shadow-sm leading-relaxed">
            Your crown, booked.
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
