"use client";

import { useActionState } from "react";
import { upsertBusiness, type BusinessProfileState } from "./actions";
import { Spinner } from "@/components/spinner";

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

  return (
    <form action={action} className="space-y-4">
      {business?.id && (
        <input type="hidden" name="business_id" value={business.id} />
      )}

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

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-foreground">
          URL slug
        </label>
        <div className="mt-1 flex rounded-lg border border-input bg-background">
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            /b/
          </span>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            defaultValue={business?.slug ?? ""}
            className="block w-full rounded-r-lg bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="my-salon"
          />
        </div>
      </div>

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

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={business?.address ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            defaultValue={business?.city ?? ""}
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
            defaultValue={business?.country ?? ""}
            placeholder="e.g. KE"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

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
