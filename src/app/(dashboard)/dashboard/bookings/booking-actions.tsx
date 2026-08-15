"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { X, Star, Send, CalendarClock, AlertTriangle, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Spinner } from "@/components/spinner";
import { cancelBooking } from "@/lib/booking/cancel-action";
import { submitReview } from "@/lib/booking/review-action";
import { rescheduleBooking } from "@/lib/booking/reschedule-action";
import { localToUtcIso } from "@/lib/format-date";
import { useRouter } from "next/navigation";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  if (done) {
    return (
      <span className="text-xs font-medium text-destructive">Cancelled</span>
    );
  }

  if (confirming) {
    return (
      <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            Are you sure you want to cancel this booking?
          </p>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await cancelBooking(bookingId);
                if (result.success) {
                  setDone(true);
                  setConfirming(false);
                  router.refresh();
                } else {
                  setError(result.error ?? "Failed");
                }
              });
            }}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
            Yes, cancel
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Keep booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
    >
      <X className="h-3 w-3" />
      Cancel
    </button>
  );
}

export function RescheduleButton({ bookingId, timezone }: { bookingId: string; timezone: string }) {
  const [open, setOpen] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <span className="text-xs font-medium text-success">Rescheduled</span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <CalendarClock className="h-3 w-3" />
        Reschedule
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/50 p-3 space-y-3">
      <p className="text-sm font-medium text-foreground">Pick a new date & time</p>
      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        min={new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 16)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <p className="text-xs text-muted-foreground">Must be at least 1 hour from now. The time will be validated against staff availability.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!dateTime) {
              setError("Pick a new date & time");
              return;
            }
            setError(null);
            startTransition(async () => {
              const result = await rescheduleBooking({
                bookingId,
                newStartsAt: localToUtcIso(dateTime, timezone),
              });
              if (result.success) {
                setDone(true);
                setOpen(false);
                router.refresh();
              } else {
                setError(result.error ?? "Failed");
              }
            });
          }}
          disabled={isPending || !dateTime}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Spinner className="h-3 w-3" /> : "Confirm"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setDateTime("");
            setError(null);
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const MAX_REVIEW_PHOTOS = 5;

export function ReviewButton({
  bookingId,
  hasReview,
}: {
  bookingId: string;
  hasReview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(hasReview);
  const [error, setError] = useState<string | null>(null);

  // Photo upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_REVIEW_PHOTOS - selectedFiles.length;
    const toAdd = files.slice(0, remaining);

    // Validate each file
    for (const file of toAdd) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPG, PNG, and WebP images are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be under 5MB");
        return;
      }
    }

    setError(null);
    const newFiles = [...selectedFiles, ...toAdd];
    setSelectedFiles(newFiles);

    // Generate preview URLs
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedFiles]);

  const removePhoto = useCallback((index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }, [previewUrls]);

  if (done) {
    return (
      <span className="text-xs font-medium text-success">Reviewed</span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Star className="h-3 w-3" />
        Leave review
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 space-y-3">
      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                s <= (hoverRating || rating)
                  ? "fill-warning text-warning"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {rating}/5
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={2}
        maxLength={2000}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Photo upload */}
      <div className="space-y-2">
        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {previewUrls.map((url, i) => (
              <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        {selectedFiles.length < MAX_REVIEW_PHOTOS && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add photos ({selectedFiles.length}/{MAX_REVIEW_PHOTOS})
            </button>
          </>
        )}
      </div>

      {uploadProgress && (
        <p className="text-xs text-muted-foreground">{uploadProgress}</p>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (rating === 0) {
              setError("Please select a rating");
              return;
            }
            setError(null);
            startTransition(async () => {
              // Submit the review text + rating
              const result = await submitReview({
                bookingId,
                rating,
                comment: comment.trim(),
              });
              if (!result.success) {
                setError(result.error ?? "Failed");
                return;
              }

              // Upload photos if any
              if (selectedFiles.length > 0 && result.reviewId) {
                setUploadProgress(`Uploading photos (0/${selectedFiles.length})...`);
                for (let i = 0; i < selectedFiles.length; i++) {
                  setUploadProgress(`Uploading photos (${i + 1}/${selectedFiles.length})...`);
                  const fd = new FormData();
                  fd.append("file", selectedFiles[i]);
                  fd.append("reviewId", result.reviewId);
                  try {
                    const res = await fetch("/api/review-images", {
                      method: "POST",
                      body: fd,
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      console.error("Photo upload failed:", data.error);
                    }
                  } catch (err) {
                    console.error("Photo upload error:", err);
                  }
                }
                setUploadProgress(null);
              }

              // Clean up preview URLs
              previewUrls.forEach((url) => URL.revokeObjectURL(url));
              setDone(true);
              setOpen(false);
            });
          }}
          disabled={isPending || rating === 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Spinner className="h-3 w-3" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Submit
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setRating(0);
            setComment("");
            setError(null);
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
            setSelectedFiles([]);
            setPreviewUrls([]);
            setUploadProgress(null);
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
