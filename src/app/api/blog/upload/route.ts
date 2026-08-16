import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeImage } from "@/lib/optimize-image";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData: any = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  const admin = createAdminClient();
  const raw = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeImage(raw, "blog");
  const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${optimized.ext}`;

  const { error } = await admin.storage
    .from("business-images")
    .upload(path, optimized.buffer, { contentType: optimized.contentType, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: publicUrl } = admin.storage.from("business-images").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
