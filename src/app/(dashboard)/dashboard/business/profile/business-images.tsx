"use client";

import { useRef, useState } from "react";

type Props = {
  businessId: string;
  logoUrl: string | null;
  coverUrl: string | null;
  gallery: string[];
};

export function BusinessImages({ businessId, logoUrl, coverUrl, gallery: initialGallery }: Props) {
  const [logo, setLogo] = useState(logoUrl ?? "");
  const [cover, setCover] = useState(coverUrl ?? "");
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, type: "logo" | "gallery") {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError("");
    setUploading(type);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("business_id", businessId);
    fd.append("type", type);

    try {
      const res = await fetch("/api/business-images", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      if (type === "logo") {
        setLogo(data.url);
      } else {
        setGallery(data.gallery);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  async function removeFromGallery(url: string) {
    try {
      const res = await fetch("/api/business-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, imageUrl: url }),
      });
      const data = await res.json();
      if (res.ok) {
        setGallery(data.gallery);
        if (cover === url) setCover("");
      }
    } catch {
      setError("Failed to remove image.");
    }
  }

  async function setCoverImage(url: string) {
    const newCover = cover === url ? "" : url;
    try {
      const res = await fetch("/api/business-images/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, coverUrl: newCover || null }),
      });
      if (res.ok) setCover(newCover);
    } catch {
      setError("Failed to set cover image.");
    }
  }

  const initial = "B";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Logo */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">Business Logo</h3>
        <div className="flex items-center gap-4">
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="h-20 w-20 rounded-xl object-cover border border-border"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary border border-border">
              {initial}
            </div>
          )}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={uploading === "logo"}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {uploading === "logo" ? "Uploading..." : logo ? "Change logo" : "Upload logo"}
            </button>
            <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 5 MB.</p>
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "logo")}
            className="hidden"
            aria-label="Upload logo"
          />
        </div>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Gallery Photos</h3>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={uploading === "gallery"}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading === "gallery" ? "Uploading..." : "Add photo"}
          </button>
          <input
            ref={galleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "gallery")}
            className="hidden"
            aria-label="Add gallery photo"
          />
        </div>

        {gallery.length > 0 ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              Click the star to set a photo as your cover image for the directory cards.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((url) => (
                <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {/* Cover badge */}
                  {cover === url && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Cover
                    </span>
                  )}
                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setCoverImage(url)}
                      className="rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground hover:bg-background"
                      title={cover === url ? "Remove as cover" : "Set as cover"}
                    >
                      {cover === url ? "Unset cover" : "Set as cover"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromGallery(url)}
                      className="rounded-md bg-destructive/90 px-2 py-1 text-xs font-medium text-white hover:bg-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No gallery photos yet. Add photos to showcase your business.
          </p>
        )}
      </div>
    </div>
  );
}
