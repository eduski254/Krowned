import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Papa from "papaparse";
import { nextSendDate } from "@/lib/email/nurture-templates";

/**
 * POST /api/admin/leads/import
 * Super-admin only. CSV import of leads.
 * Columns: name, email, business_name, phone, source, tags, city
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const csvText = await file.text();
  const { data: rows, errors: parseErrors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (parseErrors.length > 0) {
    return NextResponse.json(
      { error: "CSV parse error", details: parseErrors.slice(0, 5) },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const now = new Date();

  // Load existing leads + suppression for deduplication
  const [existingRes, suppressionRes] = await Promise.all([
    admin.from("leads").select("email"),
    admin.from("email_suppression").select("email"),
  ]);

  const existingEmails = new Set(
    (existingRes.data ?? []).map((r) => (r.email as string)?.toLowerCase()),
  );
  const suppressedEmails = new Set(
    (suppressionRes.data ?? []).map((r) => (r.email as string)?.toLowerCase()),
  );

  let imported = 0;
  let skippedExisting = 0;
  let skippedSuppressed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row.email?.trim().toLowerCase();

    if (!email) {
      errors.push(`Row ${i + 2}: missing email`);
      continue;
    }

    if (existingEmails.has(email)) {
      skippedExisting++;
      continue;
    }

    if (suppressedEmails.has(email)) {
      skippedSuppressed++;
      continue;
    }

    const tags = row.tags
      ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const { error: insertError } = await admin.from("leads").insert({
      name: row.name?.trim() || null,
      email,
      business_name: row.business_name?.trim() || null,
      phone: row.phone?.trim() || null,
      source: row.source?.trim() || "import",
      tags,
      city: row.city?.trim() || null,
      stage: "new",
      nurture_status: "active",
      nurture_step: 0,
      nurture_started_at: now.toISOString(),
      nurture_next_at: nextSendDate(now, 0).toISOString(),
      source_captured_at: now.toISOString(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        skippedExisting++;
      } else {
        errors.push(`Row ${i + 2}: ${insertError.message}`);
      }
    } else {
      imported++;
      existingEmails.add(email); // prevent dupe within same batch
    }
  }

  return NextResponse.json({
    imported,
    skipped_existing: skippedExisting,
    skipped_suppressed: skippedSuppressed,
    errors: errors.slice(0, 20),
    total_rows: rows.length,
  });
}
