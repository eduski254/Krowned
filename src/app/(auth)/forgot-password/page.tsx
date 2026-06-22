"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type AuthState } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    forgotPassword,
    null,
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {state?.success && (
        <div className="mb-4 rounded-lg bg-accent/10 p-3 text-sm text-foreground">
          {state.message}
        </div>
      )}

      {state?.error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </>
  );
}
