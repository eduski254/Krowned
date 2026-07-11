"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  Scissors,
  Camera,
  Check,
  PartyPopper,
  Calendar,
  Users,
  Clock,
  CreditCard,
} from "lucide-react";
import { Spinner } from "@/components/spinner";
import {
  AddressAutocomplete,
  type AddressResult,
} from "@/components/address-autocomplete";
import {
  saveBusinessBasics,
  saveBusinessLocation,
  saveFirstService,
  completeOnboarding,
} from "@/lib/onboarding/actions";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  businessId: string;
  categories: Category[];
  savedBasics: { name: string; description: string; primaryCategoryId: string };
  savedLocation: { address: string; city: string; latitude: number | null; longitude: number | null; locationNotes: string };
  savedService: { name: string; durationMinutes: number; priceAmount: number } | null;
}

const STEPS = [
  { label: "Basics", icon: Building2 },
  { label: "Location", icon: MapPin },
  { label: "Service", icon: Scissors },
  { label: "Photo", icon: Camera },
] as const;

export function OnboardingWizard({
  businessId,
  categories,
  savedBasics,
  savedLocation,
  savedService,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [basics, setBasics] = useState(savedBasics);
  const [location, setLocation] = useState(savedLocation);
  const [service, setService] = useState(
    savedService ?? { name: "", durationMinutes: 60, priceAmount: 0 },
  );
  const [priceDisplay, setPriceDisplay] = useState(
    savedService ? (savedService.priceAmount / 100).toFixed(2) : "",
  );

  // Photo state
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  function handleNext() {
    setError(null);
    startTransition(async () => {
      if (step === 0) {
        if (!basics.name.trim()) { setError("Business name is required."); return; }
        if (!basics.primaryCategoryId) { setError("Pick a category."); return; }
        const result = await saveBusinessBasics(basics);
        if (result.error) { setError(result.error); return; }
      } else if (step === 1) {
        if (!location.address.trim()) { setError("Address is required."); return; }
        if (!location.city.trim()) { setError("City is required."); return; }
        const result = await saveBusinessLocation(location);
        if (result.error) { setError(result.error); return; }
      } else if (step === 2) {
        if (!service.name.trim()) { setError("Service name is required."); return; }
        if (service.durationMinutes < 15) { setError("Duration must be at least 15 minutes."); return; }
        const result = await saveFirstService(service);
        if (result.error) { setError(result.error); return; }
      } else if (step === 3) {
        // Photo step — optional, just complete
        const result = await completeOnboarding();
        if (result.error) { setError(result.error); return; }
        setShowSuccess(true);
        return;
      }
      setStep((s) => s + 1);
    });
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Max 5 MB.");
      return;
    }

    setUploadError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("business_id", businessId);
    fd.append("type", "logo");

    try {
      const res = await fetch("/api/business-images", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
      } else {
        setLogoUrl(data.url);
      }
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Success screen ──
  if (showSuccess) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <PartyPopper className="h-10 w-10 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            You&apos;re all set!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your business is live on Krown. Clients can now find and book you.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-foreground">
            A few things to do next:
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Set your business hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Invite your team (if you have staff)</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Choose a plan to accept online bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Add more services</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/business")}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Go to your dashboard
        </button>
      </div>
    );
  }

  // ── Progress indicator ──
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  i === step
                    ? "bg-primary/10 text-primary"
                    : i < step
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        {step === 0 && (
          <StepBasics
            basics={basics}
            setBasics={setBasics}
            categories={categories}
          />
        )}
        {step === 1 && (
          <StepLocation location={location} setLocation={setLocation} />
        )}
        {step === 2 && (
          <StepService
            service={service}
            setService={setService}
            priceDisplay={priceDisplay}
            setPriceDisplay={setPriceDisplay}
          />
        )}
        {step === 3 && (
          <StepPhoto
            logoUrl={logoUrl}
            uploading={uploading}
            uploadError={uploadError}
            onUpload={handleLogoUpload}
          />
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {isPending ? (
            <Spinner className="h-4 w-4" />
          ) : step === 3 ? (
            <>
              Finish setup
              <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Step Components ──

function StepBasics({
  basics,
  setBasics,
  categories,
}: {
  basics: Props["savedBasics"];
  setBasics: (b: Props["savedBasics"]) => void;
  categories: Category[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold font-heading text-foreground">
          Tell us about your business
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how clients will find you on Krown.
        </p>
      </div>

      <div>
        <label htmlFor="biz-name" className="block text-sm font-medium text-foreground">
          Business name
        </label>
        <input
          id="biz-name"
          type="text"
          value={basics.name}
          onChange={(e) => setBasics({ ...basics, name: e.target.value })}
          placeholder="e.g. Sarah's Beauty Studio"
          maxLength={100}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="biz-category" className="block text-sm font-medium text-foreground">
          Primary category
        </label>
        <select
          id="biz-category"
          value={basics.primaryCategoryId}
          onChange={(e) => setBasics({ ...basics, primaryCategoryId: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="biz-desc" className="block text-sm font-medium text-foreground">
          Short description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="biz-desc"
          value={basics.description}
          onChange={(e) => setBasics({ ...basics, description: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="What makes your business special?"
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{basics.description.length}/500</p>
      </div>
    </div>
  );
}

function StepLocation({
  location,
  setLocation,
}: {
  location: Props["savedLocation"];
  setLocation: (l: Props["savedLocation"]) => void;
}) {
  function handlePlaceSelect(result: AddressResult) {
    setLocation({
      ...location,
      address: result.address,
      city: result.city || location.city,
      latitude: result.lat,
      longitude: result.lng,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold font-heading text-foreground">
          Where are you located?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clients search by location — this helps them find you.
        </p>
      </div>

      <div>
        <label htmlFor="ob-address" className="block text-sm font-medium text-foreground">
          Address
        </label>
        <AddressAutocomplete
          id="ob-address"
          value={location.address}
          onChange={(val) => setLocation({ ...location, address: val })}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Start typing your business address..."
          required
        />
      </div>

      <div>
        <label htmlFor="ob-city" className="block text-sm font-medium text-foreground">
          City
        </label>
        <input
          id="ob-city"
          type="text"
          value={location.city}
          onChange={(e) => setLocation({ ...location, city: e.target.value })}
          placeholder="e.g. Nairobi"
          maxLength={100}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="ob-location-notes" className="block text-sm font-medium text-foreground">
          Additional location info{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="ob-location-notes"
          type="text"
          value={location.locationNotes}
          onChange={(e) => setLocation({ ...location, locationNotes: e.target.value })}
          placeholder="e.g. 3rd floor, Suite K11, behind Total petrol station"
          maxLength={500}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Building name, floor, suite, or landmarks to help clients find you.
        </p>
      </div>

      {location.latitude != null && location.longitude != null && (
        <p className="text-xs text-muted-foreground">
          Coordinates captured: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}

function StepService({
  service,
  setService,
  priceDisplay,
  setPriceDisplay,
}: {
  service: { name: string; durationMinutes: number; priceAmount: number };
  setService: (s: typeof service) => void;
  priceDisplay: string;
  setPriceDisplay: (v: string) => void;
}) {
  function handlePriceChange(val: string) {
    setPriceDisplay(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setService({ ...service, priceAmount: Math.round(num * 100) });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold font-heading text-foreground">
          Add your first service
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You need at least one service to be bookable. You can add more later.
        </p>
      </div>

      <div>
        <label htmlFor="svc-name" className="block text-sm font-medium text-foreground">
          Service name
        </label>
        <input
          id="svc-name"
          type="text"
          value={service.name}
          onChange={(e) => setService({ ...service, name: e.target.value })}
          placeholder="e.g. Haircut & Blow Dry"
          maxLength={100}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="svc-duration" className="block text-sm font-medium text-foreground">
            Duration (min)
          </label>
          <select
            id="svc-duration"
            value={service.durationMinutes}
            onChange={(e) => setService({ ...service, durationMinutes: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[15, 30, 45, 60, 90, 120, 150, 180, 240].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}m` : ""}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="svc-price" className="block text-sm font-medium text-foreground">
            Price (USD)
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              id="svc-price"
              type="number"
              min="0"
              step="0.01"
              value={priceDisplay}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="block w-full rounded-lg border border-input bg-background pl-7 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPhoto({
  logoUrl,
  uploading,
  uploadError,
  onUpload,
}: {
  logoUrl: string | null;
  uploading: boolean;
  uploadError: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold font-heading text-foreground">
          Add a logo or photo
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help clients recognize your business. You can skip this and add it later.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Business logo"
            className="h-28 w-28 rounded-xl object-cover border-2 border-border"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-within:ring-2 focus-within:ring-ring">
          {uploading ? "Uploading..." : logoUrl ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            disabled={uploading}
            className="sr-only"
            aria-label="Upload business logo"
          />
        </label>

        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP — max 5 MB
        </p>

        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
      </div>
    </div>
  );
}
