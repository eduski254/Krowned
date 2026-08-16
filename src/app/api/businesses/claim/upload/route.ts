import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const businessId = formData.get("businessId") as string | null;

  if (!file || !businessId) {
    return NextResponse.json({ error: "File and businessId required" }, { status: 400 });
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const allowedExts = ["jpg", "jpeg", "png", "webp", "pdf"];
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: "Only images and PDFs are allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `claim-proofs/${user.id}-${businessId}-${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from("business-images")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("business-images")
    .getPublicUrl(storagePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
