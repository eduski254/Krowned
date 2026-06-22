"use client";

import { useActionState } from "react";
import { resetPassword, type AuthState } from "../actions";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resetPassword,
    null,
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="At least 8 characters"
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>
    </>
  );
}
