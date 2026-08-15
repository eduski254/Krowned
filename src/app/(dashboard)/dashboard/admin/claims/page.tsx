export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimsTable } from "./claims-table";

export default async function AdminClaimsPage() {
  const admin = createAdminClient();

  const { data: claims } = await admin
    .from("listing_claims")
    .select(
      "id, full_name, email, phone, proof_notes, status, created_at, business_id, claimant_id, businesses(name, slug), profiles!listing_claims_claimant_id_fkey(full_name, email)",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Listing Claims</h1>
      <p className="mt-1 text-muted-foreground">
        Review and approve business ownership claims.
      </p>
      <div className="mt-6">
        <ClaimsTable claims={claims ?? []} />
      </div>
    </div>
  );
}
