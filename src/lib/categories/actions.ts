"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

// ── Helpers ──────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") {
    throw new Error("Forbidden: super admin only");
  }

  return supabase;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Schemas ──────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
  sort_order: z.number().int().min(0).default(0),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const reorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  }),
);

// ── Actions ──────────────────────────────────────────────────────

export async function createCategory(input: z.input<typeof createSchema>) {
  const data = createSchema.parse(input);
  const supabase = await requireSuperAdmin();

  const slug = slugify(data.name);

  const { data: created, error } = await supabase
    .from("service_categories")
    .insert({ name: data.name, slug, icon: data.icon ?? null, sort_order: data.sort_order })
    .select("id, name, slug, icon, sort_order")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A category with that name/slug already exists." };
    return { error: error.message };
  }

  return { data: created };
}

export async function updateCategory(input: z.input<typeof updateSchema>) {
  const { id, ...fields } = updateSchema.parse(input);
  const supabase = await requireSuperAdmin();

  const updates: Record<string, unknown> = {};
  if (fields.name !== undefined) {
    updates.name = fields.name;
    updates.slug = slugify(fields.name);
  }
  if (fields.icon !== undefined) updates.icon = fields.icon;
  if (fields.sort_order !== undefined) updates.sort_order = fields.sort_order;

  if (Object.keys(updates).length === 0) return { error: "Nothing to update." };

  const { error } = await supabase
    .from("service_categories")
    .update(updates)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "A category with that name/slug already exists." };
    return { error: error.message };
  }

  return { success: true };
}

export async function reorderCategories(input: z.input<typeof reorderSchema>) {
  const items = reorderSchema.parse(input);
  const supabase = await requireSuperAdmin();

  // Update each in parallel
  const results = await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("service_categories").update({ sort_order }).eq("id", id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  return { success: true };
}

export async function deleteCategory(id: string) {
  z.string().uuid().parse(id);
  const supabase = await requireSuperAdmin();

  // Check if any services reference this category
  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      error: `Cannot delete: ${count} service${count > 1 ? "s" : ""} use this category. Reassign them first.`,
    };
  }

  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  return { success: true };
}
