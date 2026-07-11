import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-lg font-heading font-extrabold text-primary">Layd</span>
            <p className="mt-3 text-sm text-muted-foreground">
              Beauty &amp; wellness, booked effortlessly.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Discover</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/explore" className="text-muted-foreground hover:text-foreground">Explore Services</Link></li>
              <li><Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Professionals</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/for-professionals" className="text-muted-foreground hover:text-foreground">List Your Business</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          Layd &mdash; Beauty &amp; Wellness Marketplace
        </div>
      </div>
    </footer>
  );
}
