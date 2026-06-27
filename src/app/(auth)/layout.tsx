import Link from "next/link";

// REVIEW: Replace with a real licensed image before launch.
// Swap this single constant to change the auth panel background.
const AUTH_HERO_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      {/* Left: image + gradient overlay brand panel (hidden on mobile) */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 items-center justify-center p-12">
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

        {/* Text content */}
        <div className="relative z-10 max-w-md text-center text-white">
          <Link
            href="/"
            className="font-heading text-4xl font-extrabold tracking-tight drop-shadow-md hover:opacity-90 transition-opacity"
          >
            Zawadi
          </Link>
          <p className="mt-4 text-lg text-white/90 drop-shadow-sm">
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
