import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/booking/availability";

/**
 * GET /api/availability?businessId=...&serviceId=...&date=YYYY-MM-DD&staffId=...
 *
 * Public endpoint — returns available 30-min slots for a given date.
 * Uses service-role client to bypass RLS for the availability computation.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const businessId = params.get("businessId");
  const serviceId = params.get("serviceId");
  const date = params.get("date");
  const staffId = params.get("staffId") || null;

  if (!businessId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Missing required parameters: businessId, serviceId, date" },
      { status: 400 },
    );
  }

  // Basic date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const result = await getAvailableSlots(admin, {
    businessId,
    serviceId,
    staffId,
    date,
  });

  return NextResponse.json(result, {
    headers: {
      // Cache for 30 seconds — slots change as bookings come in
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
