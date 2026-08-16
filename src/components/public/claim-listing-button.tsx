"use client";

import { ShieldCheck } from "lucide-react";

export function ClaimListingButton({
  businessId,
  businessName,
  isLoggedIn,
}: {
  businessId: string;
  businessName: string;
  isLoggedIn: boolean;
}) {
  const claimUrl = `/claim/${businessId}`;

  if (!isLoggedIn) {
    return (
      <a
        href={`/signup?type=professional&claim=${businessId}&redirect=${encodeURIComponent(claimUrl)}`}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <ShieldCheck className="h-4 w-4" />
        Is this your business? Claim it
      </a>
    );
  }

  return (
    <a
      href={claimUrl}
      className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
    >
      <ShieldCheck className="h-4 w-4" />
      Is this your business? Claim it
    </a>
  );
}
