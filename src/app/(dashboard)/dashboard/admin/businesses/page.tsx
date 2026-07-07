import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BusinessesTable } from "@/components/admin/BusinessesTable";

export default async function AdminBusinessesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, city, country, verification_status, subscription_status, is_published, owner_id, owner:owner_id(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (businesses ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    city: b.city,
    country: b.country,
    verification_status: b.verification_status,
    subscription_status: b.subscription_status,
    is_published: b.is_published ?? false,
    owner_id: b.owner_id,
    owner: b.owner as unknown as { full_name: string } | null,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground font-heading">
        Businesses
      </h1>
      <BusinessesTable rows={rows} />
    </div>
  );
}
