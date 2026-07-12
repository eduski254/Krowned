import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
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
          <div>
            <h3 className="text-sm font-semibold text-foreground">Discover</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/explore" className="text-muted-foreground hover:text-foreground">Find a stylist</Link></li>
              <li><Link href="/styles" className="text-muted-foreground hover:text-foreground">Styles</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="/our-story" className="text-muted-foreground hover:text-foreground">Our story</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Stylists</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/for-stylists" className="text-muted-foreground hover:text-foreground">List your studio</Link></li>
              <li><Link href="/stylist-terms" className="text-muted-foreground hover:text-foreground">Stylist terms</Link></li>
              <li><Link href="/community-guidelines" className="text-muted-foreground hover:text-foreground">Community guidelines</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
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
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          Krowned &mdash; Your crown, booked.
        </div>
      </div>
    </footer>
  );
}
