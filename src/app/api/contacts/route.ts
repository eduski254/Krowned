import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/contacts?businessId=...&q=...
 * Search business contacts by name, phone, or email.
 * Only accessible to the business owner or active staff.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify access: owner or staff
  const [{ data: biz }, { data: staff }] = await Promise.all([
    supabase.from("businesses").select("id, owner_id").eq("id", businessId).single(),
    supabase.from("staff").select("id").eq("business_id", businessId).eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (biz.owner_id !== user.id && !staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build query
  let query = supabase
    .from("business_contacts")
    .select("id, name, phone, email, created_at")
    .eq("business_id", businessId)
    .order("name", { ascending: true })
    .limit(20);

  if (q && q.length > 0) {
    // Search across name, phone, email using OR with ilike
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: contacts, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json({ contacts: contacts ?? [] });
}
