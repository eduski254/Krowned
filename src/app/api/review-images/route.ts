import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 5;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData: any = await request.formData();
  const file = formData.get("file") as File | null;
  const reviewId = formData.get("reviewId") as string | null;

  if (!file || !reviewId) {
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

  const admin = createAdminClient();

  // Verify the review belongs to the authenticated user
  const { data: review } = await admin
    .from("reviews")
    .select("id, client_id, photos")
    .eq("id", reviewId)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.client_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Check photo limit
  const currentPhotos: string[] = Array.isArray(review.photos) ? (review.photos as string[]) : [];
  if (currentPhotos.length >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS} photos per review` },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${reviewId}/${filename}`;

  const { error: uploadError } = await admin.storage
    .from("review-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("review-images").getPublicUrl(path);

  const imageUrl = `${publicUrl}?v=${Date.now()}`;

  // Append URL to review.photos jsonb array
  currentPhotos.push(imageUrl);

  const { error: updateError } = await admin
    .from("reviews")
    .update({ photos: currentPhotos })
    .eq("id", reviewId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update review photos" }, { status: 500 });
  }

  return NextResponse.json({ url: imageUrl, photos: currentPhotos });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reviewId, imageUrl } = await request.json();

  if (!reviewId || !imageUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: review } = await admin
    .from("reviews")
    .select("id, client_id, photos")
    .eq("id", reviewId)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.client_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Remove from photos array
  const currentPhotos: string[] = Array.isArray(review.photos) ? (review.photos as string[]) : [];
  const updated = currentPhotos.filter((url) => url !== imageUrl);

  // Extract storage path from the public URL to delete the file
  // Public URL format: .../storage/v1/object/public/review-images/{reviewId}/{filename}?v=...
  try {
    const urlObj = new URL(imageUrl.split("?")[0]);
    const pathParts = urlObj.pathname.split("/review-images/");
    if (pathParts[1]) {
      await admin.storage.from("review-images").remove([pathParts[1]]);
    }
  } catch {
    // If URL parsing fails, still update the array
  }

  const { error: updateError } = await admin
    .from("reviews")
    .update({ photos: updated })
    .eq("id", reviewId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update review photos" }, { status: 500 });
  }

  return NextResponse.json({ photos: updated });
}
