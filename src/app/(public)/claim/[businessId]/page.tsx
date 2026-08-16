import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { ClaimForm } from "./claim-form";

export const metadata: Metadata = {
  title: "Claim Your Listing — Krowned",
  description: "Verify you own this business to manage your profile, add services, and accept bookings on Krowned.",
};

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?type=professional&claim=${businessId}&redirect=${encodeURIComponent(`/claim/${businessId}`)}`);
  }

  // Fetch business
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, address, phone, claimed, cover_url")
    .eq("id", businessId)
    .single();

  if (!business) notFound();

  if (business.claimed) {
    redirect(`/b/${business.slug}`);
  }

  // Check for existing claim
  const { data: existingClaim } = await supabase
    .from("listing_claims")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("claimant_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">
          Claim &ldquo;{business.name}&rdquo;
        </h1>
        <p className="mt-2 text-muted-foreground">
          Verify you&apos;re the owner to manage this listing, add services, and accept bookings.
        </p>

        {/* Business card preview */}
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          {business.cover_url ? (
            <img
              src={business.cover_url}
              alt={business.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-2xl font-bold text-muted-foreground">
              {business.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground">{business.name}</p>
            {business.address && (
              <p className="text-sm text-muted-foreground">{business.address}</p>
            )}
          </div>
        </div>

        {existingClaim ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-6 text-center">
            {existingClaim.status === "pending" ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <span className="text-2xl">&#9203;</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Claim under review</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your claim is being reviewed by our team. We&apos;ll get back to you within 24–48 hours.
                </p>
              </>
            ) : existingClaim.status === "approved" ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <span className="text-2xl">&#10003;</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Claim approved!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You now own this listing. Head to your dashboard to start managing it.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <span className="text-2xl">&#10007;</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Claim rejected</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your previous claim was not approved. If you believe this is an error, please contact support.
                </p>
              </>
            )}
          </div>
        ) : (
          <ClaimForm
            businessId={business.id}
            businessPhone={business.phone}
            userEmail={user.email ?? ""}
            userName={user.user_metadata?.full_name ?? ""}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
