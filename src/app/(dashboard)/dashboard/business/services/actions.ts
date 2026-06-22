"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { serviceSchema } from "@/lib/validations/service";

export type ServiceFormState = {
  error?: string;
  success?: boolean;
} | null;

async function getOwnedBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  return business ? { supabase, user, business } : null;
}

export async function createService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const ctx = await getOwnedBusiness();
  if (!ctx) return { error: "Not authenticated or no business" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const { is_active, ...rest } = parsed.data;

  const { error } = await ctx.supabase.from("services").insert({
    ...rest,
    is_active,
    business_id: ctx.business.id,
  });

  if (error) return { error: error.message };

  redirect("/dashboard/business/services");
}

export async function updateService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const ctx = await getOwnedBusiness();
  if (!ctx) return { error: "Not authenticated or no business" };

  const serviceId = formData.get("service_id") as string;
  if (!serviceId) return { error: "Missing service ID" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0];
    return { error: first?.[0] ?? "Invalid input" };
  }

  const { is_active, ...rest } = parsed.data;

  const { error } = await ctx.supabase
    .from("services")
    .update({ ...rest, is_active })
    .eq("id", serviceId)
    .eq("business_id", ctx.business.id);

  if (error) return { error: error.message };

  return { success: true };
}

export async function deleteService(formData: FormData) {
  const ctx = await getOwnedBusiness();
  if (!ctx) return;

  const serviceId = formData.get("service_id") as string;
  if (!serviceId) return;

  await ctx.supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", ctx.business.id);

  redirect("/dashboard/business/services");
}

export async function updateStaffServices(formData: FormData) {
  const ctx = await getOwnedBusiness();
  if (!ctx) return;

  const serviceId = formData.get("service_id") as string;
  const staffIds = formData.getAll("staff_ids") as string[];

  if (!serviceId) return;

  // Delete existing mappings for this service
  await ctx.supabase
    .from("staff_services")
    .delete()
    .eq("service_id", serviceId);

  // Insert new mappings
  if (staffIds.length > 0) {
    await ctx.supabase.from("staff_services").insert(
      staffIds.map((staffId) => ({
        staff_id: staffId,
        service_id: serviceId,
      })),
    );
  }

  redirect(`/dashboard/business/services/${serviceId}`);
}
