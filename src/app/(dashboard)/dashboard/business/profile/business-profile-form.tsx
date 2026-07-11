"use client";

import { useActionState, useState, useRef, useCallback, useEffect } from "react";
import { upsertBusiness, type BusinessProfileState } from "./actions";
import { Spinner } from "@/components/spinner";
import {
  AddressAutocomplete,
  type AddressResult,
} from "@/components/address-autocomplete";
import { Copy, Check, Share2, ChevronDown, ChevronUp } from "lucide-react";

type BusinessData = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  primary_category_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_notes?: string | null;
  social_links?: Record<string, string> | null;
} | null;

export function BusinessProfileForm({
  business,
  categories,
}: {
  business: BusinessData;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<BusinessProfileState, FormData>(
    upsertBusiness,
    null,
  );

  const [address, setAddress] = useState(business?.address ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [country, setCountry] = useState(business?.country ?? "");
  const [lat, setLat] = useState<number | null>(business?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(business?.longitude ?? null);

  function handlePlaceSelect(result: AddressResult) {
    setAddress(result.address);
    if (result.city) setCity(result.city);
    if (result.country) setCountry(result.country);
    setLat(result.lat);
    setLng(result.lng);
  }

  return (
    <form action={action} className="space-y-4">
      {business?.id && (
        <input type="hidden" name="business_id" value={business.id} />
      )}
      <input type="hidden" name="latitude" value={lat ?? ""} />
      <input type="hidden" name="longitude" value={lng ?? ""} />

      {state?.success && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
          Business profile saved.
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Business name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={business?.name ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <SlugField defaultSlug={business?.slug ?? ""} />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={business?.description ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="primary_category_id" className="block text-sm font-medium text-foreground">
          Primary category
        </label>
        <select
          id="primary_category_id"
          name="primary_category_id"
          defaultValue={business?.primary_category_id ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="biz_phone" className="block text-sm font-medium text-foreground">
            Phone
          </label>
          <input
            id="biz_phone"
            name="phone"
            type="tel"
            defaultValue={business?.phone ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="biz_email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="biz_email"
            name="email"
            type="email"
            defaultValue={business?.email ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Address with Google Places autocomplete */}
      <div>
        <label htmlFor="profile-address" className="block text-sm font-medium text-foreground">
          Address
        </label>
        <AddressAutocomplete
          id="profile-address"
          name="address"
          value={address}
          onChange={setAddress}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Start typing your business address..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
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
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. KE"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Social links */}
      <SocialLinksSection socialLinks={business?.social_links ?? null} />

      {/* Additional location info */}
      <div>
        <label htmlFor="location_notes" className="block text-sm font-medium text-foreground">
          Additional location info{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="location_notes"
          name="location_notes"
          type="text"
          defaultValue={business?.location_notes ?? ""}
          placeholder="e.g. 3rd floor, Suite K11, behind Total petrol station"
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Building name, floor, suite, or landmarks to help clients find you.
        </p>
      </div>

      {lat != null && lng != null && (
        <p className="text-xs text-muted-foreground">
          Coordinates captured: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? <><Spinner className="h-4 w-4" /> Saving...</> : business?.id ? "Save changes" : "Create Business"}
      </button>
    </form>
  );
}

/* ── Slug field with full URL, copy & share ─────────────────────── */

const SHARE_SOCIALS = [
  {
    name: "Facebook",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    ),
    url: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  },
  {
    name: "X (Twitter)",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    ),
    url: (link: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`,
  },
  {
    name: "WhatsApp",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    ),
    url: (link: string) => `https://wa.me/?text=${encodeURIComponent(link)}`,
  },
];

function SlugField({ defaultSlug }: { defaultSlug: string }) {
  const [slug, setSlug] = useState(defaultSlug);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${origin}/b/${slug}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [fullUrl]);

  const handleShare = useCallback(() => {
    // Use native share on mobile if available
    if (navigator.share) {
      navigator
        .share({ title: "Check out my business on Layd", url: fullUrl })
        .catch(() => {});
      return;
    }
    // Desktop: toggle social dropdown
    setShowShare((prev) => !prev);
  }, [fullUrl]);

  // Close share dropdown on outside click
  useEffect(() => {
    if (!showShare) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showShare]);

  return (
    <div>
      <label htmlFor="slug" className="block text-sm font-medium text-foreground">
        Business URL
      </label>
      <div className="mt-1 flex items-center rounded-lg border border-input bg-background">
        <span className="flex shrink-0 items-center pl-3 text-sm text-muted-foreground">
          {origin}/b/
        </span>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="block w-full min-w-0 bg-transparent px-1 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
          placeholder="my-salon"
        />
        <div className="flex shrink-0 items-center gap-0.5 pr-1">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          {/* Share button */}
          <div ref={shareRef} className="relative">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Share link"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {/* Desktop share dropdown */}
            {showShare && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="px-3 pb-1 pt-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Share to
                  </span>
                </div>
                {SHARE_SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.url(fullUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShare(false)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <s.icon />
                    <span>{s.name}</span>
                  </a>
                ))}
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();
                      setShowShare(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy link</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        This is your public business page link. Share it with clients.
      </p>
    </div>
  );
}

/* ── Social Links collapsible section ─────────────────────────────── */

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbusiness" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbusiness" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/yourbusiness" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourbusiness" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourbusiness" },
  { key: "website", label: "Website", placeholder: "https://yourbusiness.com" },
] as const;

function SocialLinksSection({ socialLinks }: { socialLinks: Record<string, string> | null }) {
  const hasAny = socialLinks && Object.values(socialLinks).some(Boolean);
  const [open, setOpen] = useState(!!hasAny);

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>Social Links</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`social_${f.key}`} className="block text-xs font-medium text-muted-foreground">
                {f.label}
              </label>
              <input
                id={`social_${f.key}`}
                name={`social_${f.key}`}
                type="url"
                defaultValue={socialLinks?.[f.key] ?? ""}
                placeholder={f.placeholder}
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
