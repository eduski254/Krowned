import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ServiceForm } from "../service-form";

export default async function NewServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) redirect("/dashboard/business");

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Add Service</h1>
      <div className="max-w-xl">
        <ServiceForm categories={categories ?? []} />
      </div>
    </div>
  );
}
