/** Resolve the best card image: cover_url → first gallery photo → logo_url → null */
export function resolveCardImage(biz: {
  cover_url: string | null;
  gallery: unknown;
  logo_url: string | null;
}): string | null {
  if (biz.cover_url) return biz.cover_url;
  const photos = parseGallery(biz.gallery);
  if (photos.length > 0) return photos[0];
  if (biz.logo_url) return biz.logo_url;
  return null;
}

function parseGallery(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((u) => typeof u === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((u: unknown) => typeof u === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}
