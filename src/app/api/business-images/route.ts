import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
  const businessId = formData.get("business_id") as string | null;
  const imageType = formData.get("type") as string | null; // "logo" | "gallery"

  if (!file || !businessId || !imageType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WebP images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  // Verify ownership
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";

  if (imageType === "logo") {
    const path = `${businessId}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("business-images")
      .getPublicUrl(path);

    const logoUrl = `${publicUrl}?v=${Date.now()}`;

    await supabase
      .from("businesses")
      .update({ logo_url: logoUrl })
      .eq("id", businessId)
      .eq("owner_id", user.id);

    return NextResponse.json({ url: logoUrl });
  }

  if (imageType === "gallery") {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${businessId}/gallery/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("business-images")
      .getPublicUrl(path);

    const imageUrl = `${publicUrl}?v=${Date.now()}`;

    // Append to gallery jsonb array
    const { data: current } = await supabase
      .from("businesses")
      .select("gallery")
      .eq("id", businessId)
      .single();

    const gallery: string[] = Array.isArray(current?.gallery) ? current.gallery as string[] : [];
    gallery.push(imageUrl);

    await supabase
      .from("businesses")
      .update({ gallery })
      .eq("id", businessId)
      .eq("owner_id", user.id);

    return NextResponse.json({ url: imageUrl, gallery });
  }

  return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { businessId, imageUrl } = await request.json();

  if (!businessId || !imageUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify ownership
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, gallery, cover_url")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Remove from gallery
  const gallery: string[] = Array.isArray(biz.gallery) ? biz.gallery as string[] : [];
  const updated = gallery.filter((url) => url !== imageUrl);

  // If the deleted image was the cover, clear cover_url
  const updatePayload: Record<string, unknown> = { gallery: updated };
  if (biz.cover_url === imageUrl) {
    updatePayload.cover_url = null;
  }

  await supabase
    .from("businesses")
    .update(updatePayload)
    .eq("id", businessId)
    .eq("owner_id", user.id);

  return NextResponse.json({ gallery: updated });
}
