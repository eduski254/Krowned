import sharp from "sharp";

export type ImageProfile = "cover" | "logo" | "avatar" | "review" | "blog";

const PROFILES: Record<ImageProfile, { maxWidth: number; maxHeight: number; quality: number }> = {
  cover:  { maxWidth: 1600, maxHeight: 1200, quality: 80 },
  logo:   { maxWidth: 400,  maxHeight: 400,  quality: 85 },
  avatar: { maxWidth: 256,  maxHeight: 256,  quality: 85 },
  review: { maxWidth: 1200, maxHeight: 1200, quality: 80 },
  blog:   { maxWidth: 1600, maxHeight: 1200, quality: 80 },
};

/**
 * Optimize an image buffer: resize within max bounds, convert to WebP, strip metadata.
 * Returns { buffer, contentType, ext }.
 */
export async function optimizeImage(
  input: Buffer,
  profile: ImageProfile,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const { maxWidth, maxHeight, quality } = PROFILES[profile];

  const buffer = await sharp(input)
    .rotate() // auto-rotate based on EXIF orientation
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  return { buffer, contentType: "image/webp", ext: "webp" };
}
