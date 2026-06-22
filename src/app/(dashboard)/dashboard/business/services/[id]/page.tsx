import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ServiceForm } from "../service-form";
import { deleteService, updateStaffServices } from "../actions";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!service) notFound();

  const [categoriesRes, staffRes, staffServicesRes] = await Promise.all([
    supabase.from("service_categories").select("id, name").order("sort_order"),
    supabase
      .from("staff")
      .select("id, display_name")
      .eq("business_id", business.id)
      .eq("status", "active"),
    supabase
      .from("staff_services")
      .select("staff_id")
      .eq("service_id", id),
  ]);

  const assignedStaffIds = new Set(
    staffServicesRes.data?.map((ss) => ss.staff_id) ?? [],
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Service</h1>
      <div className="max-w-xl space-y-8">
        <ServiceForm
          service={service}
          categories={categoriesRes.data ?? []}
        />

        {/* Staff capability mapping */}
        {staffRes.data && staffRes.data.length > 0 && (
          <form action={updateStaffServices} className="rounded-xl border border-border bg-card p-6">
            <input type="hidden" name="service_id" value={id} />
            <h2 className="text-lg font-semibold text-foreground">
              Staff who can perform this service
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select which staff members are capable of this service.
            </p>
            <div className="mt-4 space-y-2">
              {staffRes.data.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="staff_ids"
                    value={s.id}
                    defaultChecked={assignedStaffIds.has(s.id)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{s.display_name}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Update staff mapping
            </button>
          </form>
        )}

        {/* Delete */}
        <form action={deleteService}>
          <input type="hidden" name="service_id" value={id} />
          <button
            type="submit"
            className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            Delete service
          </button>
        </form>
      </div>
    </div>
  );
}
