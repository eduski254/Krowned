import Link from "next/link";

const SEO_LINKS = [
  { label: "Braiders in DC", href: "/explore?q=braids&city=Washington" },
  { label: "Loc techs in Silver Spring", href: "/explore?q=locs&city=Silver+Spring" },
  { label: "Barbers in Baltimore", href: "/explore?q=barber&city=Baltimore" },
  { label: "Knotless braids in Arlington", href: "/explore?q=knotless+braids&city=Arlington" },
  { label: "Silk press in Bethesda", href: "/explore?q=silk+press&city=Bethesda" },
  { label: "Locs in Bowie", href: "/explore?q=locs&city=Bowie" },
  { label: "Braiders in Hyattsville", href: "/explore?q=braids&city=Hyattsville" },
  { label: "Fades in Largo", href: "/explore?q=fade&city=Largo" },
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.29 0 .57.04.84.12V9.01a6.36 6.36 0 0 0-.84-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.22a8.16 8.16 0 0 0 4.77 1.53V7.34a4.85 4.85 0 0 1-1.01-.65z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="/brand/logo-white.png"
              alt="Krowned"
              className="h-7 w-auto hidden dark:block"
            />
            <img
              src="/brand/logo-black.png"
              alt="Krowned"
              className="h-7 w-auto block dark:hidden"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Your crown, booked.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Clients</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/explore" className="text-muted-foreground hover:text-foreground">Find a stylist</Link></li>
              <li><Link href="/styles" className="text-muted-foreground hover:text-foreground">Browse styles</Link></li>
              <li><Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">How it works</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>

          {/* For Stylists */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Stylists</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/for-stylists" className="text-muted-foreground hover:text-foreground">List your studio</Link></li>
              <li><Link href="/for-professionals" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="/community-guidelines" className="text-muted-foreground hover:text-foreground">Community guidelines</Link></li>
              <li><Link href="/stylist-terms" className="text-muted-foreground hover:text-foreground">Stylist terms</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/our-story" className="text-muted-foreground hover:text-foreground">Our story</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground">Cookie Policy</Link></li>
              <li><Link href="/cancellation-policy" className="text-muted-foreground hover:text-foreground">Cancellation &amp; Refunds</Link></li>
              <li><Link href="/accessibility" className="text-muted-foreground hover:text-foreground">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        {/* Popular areas (local SEO) */}
        <div className="mt-10 border-t border-border pt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Popular Areas
          </h4>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {SEO_LINKS.map((link, i) => (
              <span key={link.label}>
                <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
                {i < SEO_LINKS.length - 1 && (
                  <span className="ml-4 text-border" aria-hidden="true">&middot;</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Krowned &middot; Made in the DMV
          </p>

          <div className="flex items-center gap-5">
            <a
              href="mailto:hello@krowned.app"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              hello@krowned.app
            </a>
            <a
              href="https://instagram.com/kraborned"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://tiktok.com/@krowned.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
