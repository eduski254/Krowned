"use client";

import { useActionState } from "react";
import { createService, updateService, type ServiceFormState } from "./actions";
import { Spinner } from "@/components/spinner";

type ServiceData = {
  id?: string;
  name?: string;
  description?: string | null;
  price_amount?: number;
  currency?: string;
  duration_minutes?: number;
  category_id?: string;
  payment_option?: string;
  is_active?: boolean;
} | null;

export function ServiceForm({
  service,
  categories,
}: {
  service?: ServiceData;
  categories: { id: string; name: string }[];
}) {
  const isEdit = !!service?.id;
  const actionFn = isEdit ? updateService : createService;
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(
    actionFn,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {service?.id && (
        <input type="hidden" name="service_id" value={service.id} />
      )}

      {state?.success && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
          Service saved.
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Service name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={service?.name ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={service?.description ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price_amount" className="block text-sm font-medium text-foreground">
            Price (minor units / cents)
          </label>
          <input
            id="price_amount"
            name="price_amount"
            type="number"
            min="0"
            required
            defaultValue={service?.price_amount ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">e.g. 2500 = $25.00</p>
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-foreground">
            Currency
          </label>
          <input
            id="currency"
            name="currency"
            type="text"
            defaultValue={service?.currency ?? "USD"}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="duration_minutes" className="block text-sm font-medium text-foreground">
          Duration (minutes)
        </label>
        <input
          id="duration_minutes"
          name="duration_minutes"
          type="number"
          min="5"
          required
          defaultValue={service?.duration_minutes ?? 30}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-foreground">
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          required
          defaultValue={service?.category_id ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="payment_option" className="block text-sm font-medium text-foreground">
          Payment option
        </label>
        <select
          id="payment_option"
          name="payment_option"
          required
          defaultValue={service?.payment_option ?? "both"}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="prepay">Prepay only</option>
          <option value="pay_at_store">Pay at store only</option>
          <option value="both">Both</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={service?.is_active ?? true}
          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
        />
        <span className="text-sm text-foreground">Active (visible to clients)</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? <><Spinner className="h-4 w-4" /> Saving...</> : isEdit ? "Save changes" : "Add Service"}
      </button>
    </form>
  );
}
