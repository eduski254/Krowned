import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { BADGES, MAX_BADGES } from "@/lib/badges";

const validIds = BADGES.map((b) => b.id);

const schema = z.object({
  businessId: z.string().uuid(),
  badges: z
    .array(z.string())
    .max(MAX_BADGES)
    .refine((arr) => arr.every((id) => validIds.includes(id)), {
      message: "Invalid badge ID",
    }),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { businessId, badges } = parsed.data;

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("businesses")
    .update({ badges })
    .eq("id", businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
