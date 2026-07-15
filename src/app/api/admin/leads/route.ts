import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextSendDate } from "@/lib/email/nurture-templates";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") return null;
  return user;
}

/** POST /api/admin/leads — Create a single lead manually */
export async function POST(request: Request) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createAdminClient();
  const now = new Date();

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Check suppression
  const { data: suppressed } = await admin
    .from("email_suppression")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (suppressed) {
    return NextResponse.json(
      { error: "This email is on the suppression list" },
      { status: 409 },
    );
  }

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      name: body.name?.trim() || null,
      email,
      business_name: body.business_name?.trim() || null,
      phone: body.phone?.trim() || null,
      source: body.source?.trim() || "manual",
      tags: Array.isArray(body.tags) ? body.tags : [],
      city: body.city?.trim() || null,
      notes: body.notes?.trim() || null,
      stage: "new",
      nurture_status: "active",
      nurture_step: 0,
      nurture_started_at: now.toISOString(),
      nurture_next_at: nextSendDate(now, 0).toISOString(),
      source_captured_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Lead with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead });
}

/** PATCH /api/admin/leads — Update lead fields */
export async function PATCH(request: Request) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // If pausing/resuming nurture, handle nurture_next_at
  if (updates.nurture_status === "paused") {
    updates.nurture_next_at = null;
  } else if (updates.nurture_status === "active") {
    // Resume: recalculate next send
    const { data: lead } = await admin
      .from("leads")
      .select("nurture_step, nurture_started_at")
      .eq("id", id)
      .single();
    if (lead?.nurture_started_at) {
      updates.nurture_next_at = nextSendDate(
        new Date(lead.nurture_started_at),
        lead.nurture_step,
      ).toISOString();
    }
  }

  const { error } = await admin.from("leads").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/leads?id=... — Delete a lead */
export async function DELETE(request: Request) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("leads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
