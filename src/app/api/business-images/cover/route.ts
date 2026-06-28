import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { businessId, coverUrl } = await request.json();

  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("businesses")
    .update({ cover_url: coverUrl ?? null })
    .eq("id", businessId)
    .eq("owner_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cover_url: coverUrl });
}
