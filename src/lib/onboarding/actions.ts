"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// ── Step 1: Business Basics ──

const basicsSchema = z.object({
  name: z.string().min(2, "Business name is required").max(100).trim(),
  primaryCategoryId: z.string().uuid("Pick a category"),
  description: z.string().max(500).trim().optional().default(""),
});

export async function saveBusinessBasics(input: z.infer<typeof basicsSchema>) {
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id, slug")
    .eq("owner_id", user.id)
    .single();

  if (!business) return { error: "Business not found." };

  // Generate a clean slug from the new name
  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Check slug uniqueness, append suffix if needed
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .neq("id", business.id)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  const { error } = await admin
    .from("businesses")
    .update({
      name: parsed.data.name,
      slug: finalSlug,
      primary_category_id: parsed.data.primaryCategoryId,
      description: parsed.data.description || null,
    })
    .eq("id", business.id);

  if (error) return { error: error.message };
  return { success: true, businessId: business.id };
}

// ── Step 2: Location ──

const locationSchema = z.object({
  address: z.string().min(3, "Address is required").max(200).trim(),
  city: z.string().min(2, "City is required").max(100).trim(),
});

export async function saveBusinessLocation(input: z.infer<typeof locationSchema>) {
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return { error: "Business not found." };

  const { error } = await admin
    .from("businesses")
    .update({
      address: parsed.data.address,
      city: parsed.data.city,
    })
    .eq("id", business.id);

  if (error) return { error: error.message };
  return { success: true };
}

// ── Step 3: First Service ──

const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required").max(100).trim(),
  durationMinutes: z.number().int().min(15, "At least 15 minutes").max(480),
  priceAmount: z.number().int().min(0, "Price must be 0 or more"), // in cents
});

export async function saveFirstService(input: z.infer<typeof serviceSchema>) {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id, primary_category_id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return { error: "Business not found." };

  // Check if service already exists from a previous attempt
  const { data: existing } = await admin
    .from("services")
    .select("id")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Update the existing service
    const { error } = await admin
      .from("services")
      .update({
        name: parsed.data.name,
        duration_minutes: parsed.data.durationMinutes,
        price_amount: parsed.data.priceAmount,
        is_active: true,
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
    return { success: true };
  }

  // Insert new service
  const { error } = await admin.from("services").insert({
    business_id: business.id,
    category_id: business.primary_category_id,
    name: parsed.data.name,
    duration_minutes: parsed.data.durationMinutes,
    price_amount: parsed.data.priceAmount,
    is_active: true,
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ── Step 4: Complete Onboarding ──

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Mark onboarding complete + publish the business
  const { error } = await admin
    .from("businesses")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      is_published: true,
      verification_status: "verified",
    })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

// ── Helper: Get onboarding state ──

export async function getOnboardingState() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id, name, description, primary_category_id, address, city, logo_url, cover_url, onboarding_completed_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return null;

  const { data: service } = await admin
    .from("services")
    .select("id, name, duration_minutes, price_amount")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();

  // Fetch categories for the form
  const { data: categories } = await admin
    .from("service_categories")
    .select("id, name, icon")
    .order("sort_order");

  return {
    business,
    service,
    categories: categories ?? [],
    completed: !!business.onboarding_completed_at,
  };
}
