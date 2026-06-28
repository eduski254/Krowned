"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfile, type ProfileState } from "./actions";
import { Spinner } from "@/components/spinner";

export function ProfileForm({
  profile,
}: {
  profile: {
    full_name: string;
    phone: string;
    country: string;
    bio: string;
    avatar_url: string;
  };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  );
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }

    setUploadError("");
    setUploading(true);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        setAvatarPreview(profile.avatar_url || "");
      } else {
        setAvatarPreview(data.avatar_url);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
      setAvatarPreview(profile.avatar_url || "");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  const initial = (profile.full_name || "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="flex items-center gap-5">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Your avatar"
            className="h-20 w-20 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary border-2 border-border">
            {initial}
          </div>
        )}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {uploading ? "Uploading..." : avatarPreview ? "Change photo" : "Upload photo"}
          </button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP. Max 5 MB.
          </p>
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
          aria-label="Upload avatar"
        />
      </div>

      {/* Profile fields form */}
      <form action={action} className="space-y-4">
        {state?.success && (
          <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
            Profile updated successfully.
          </div>
        )}
        {state?.error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={profile.full_name}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            About
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={profile.bio}
            placeholder="Tell others a little about yourself..."
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">Max 500 characters</p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            defaultValue={profile.country}
            placeholder="e.g. KE, US"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <><Spinner className="h-4 w-4" /> Saving...</> : "Save changes"}
        </button>
      </form>
    </div>
  );
}
