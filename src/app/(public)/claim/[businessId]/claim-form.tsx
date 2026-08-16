"use client";

import { useState, useRef } from "react";
import { Upload, X, ShieldCheck, FileText, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClaimForm({
  businessId,
  businessPhone,
  userEmail,
  userName,
}: {
  businessId: string;
  businessPhone: string | null;
  userEmail: string;
  userName: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    setProofFile(file);
    setError(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  }

  function removeFile() {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    // Upload proof image if provided
    let proofImageUrl: string | null = null;
    if (proofFile) {
      setUploading(true);
      const uploadForm = new FormData();
      uploadForm.append("file", proofFile);
      uploadForm.append("businessId", businessId);

      const uploadRes = await fetch("/api/businesses/claim/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setError(data.error || "Failed to upload proof document");
        setSubmitting(false);
        setUploading(false);
        return;
      }

      const uploadData = await uploadRes.json();
      proofImageUrl = uploadData.url;
      setUploading(false);
    }

    const res = await fetch("/api/businesses/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        fullName: form.get("fullName"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        proofNotes: form.get("proofNotes") || undefined,
        proofImageUrl,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Claim submitted!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll review your claim and get back to you within 24–48 hours.
          You&apos;ll receive an email at <span className="font-medium text-foreground">{userEmail}</span> once it&apos;s reviewed.
        </p>
        <button
          onClick={() => router.push("/explore")}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to explore
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* Pre-filled fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Full name *
          </label>
          <input
            name="fullName"
            required
            defaultValue={userName}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={userEmail}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">
          Phone
        </label>
        <input
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="(555) 123-4567"
        />
        {businessPhone && (
          <p className="mt-1 text-xs text-muted-foreground">
            Tip: if you can verify the phone number on file ({businessPhone}), approval is faster.
          </p>
        )}
      </div>

      {/* Proof upload */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Proof of ownership *
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload one of: business license, utility bill at the business address, Google Business profile screenshot, or a photo of yourself at the location.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {proofFile ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            {proofPreview ? (
              <img
                src={proofPreview}
                alt="Proof preview"
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{proofFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(proofFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <Upload className="h-5 w-5" />
            Click to upload proof document or photo
          </button>
        )}
      </div>

      {/* Additional notes */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Additional notes
        </label>
        <textarea
          name="proofNotes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Any additional information to help verify your ownership..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !proofFile}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {uploading ? "Uploading proof..." : submitting ? "Submitting claim..." : "Submit Claim"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Claims are reviewed by our team within 24–48 hours. False claims may result in account suspension.
      </p>
    </form>
  );
}
