import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import { BusinessProfileForm } from "./business-profile-form";
import { BusinessImages } from "./business-images";

export default async function BusinessProfilePage() {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name")
    .order("sort_order");

  const gallery: string[] = business
    ? Array.isArray(business.gallery)
      ? (business.gallery as string[])
      : []
    : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold font-heading text-foreground">
        {business ? "Edit Business Profile" : "Create Your Business"}
      </h1>
      <div className="max-w-2xl space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <BusinessProfileForm
            business={business}
            categories={categories ?? []}
          />
        </div>

        {business && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Photos</h2>
            <BusinessImages
              businessId={business.id}
              logoUrl={business.logo_url}
              coverUrl={business.cover_url}
              gallery={gallery}
            />
          </div>
        )}
      </div>
    </div>
  );
}
