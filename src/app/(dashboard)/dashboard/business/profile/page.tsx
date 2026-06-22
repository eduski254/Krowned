import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BusinessProfileForm } from "./business-profile-form";

export default async function BusinessProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {business ? "Edit Business Profile" : "Create Your Business"}
      </h1>
      <div className="max-w-2xl">
        <BusinessProfileForm
          business={business}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
