"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signup, loginWithGoogle, resendConfirmation, type AuthState } from "../actions";
import { Spinner } from "@/components/spinner";
import { PasswordInput } from "@/components/password-input";
import { Mail, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    null,
  );
  const [accountType, setAccountType] = useState<"client" | "professional">(
    typeParam === "professional" ? "professional" : "client",
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>

      {/* Client / Professional toggle */}
      <div className="mb-6 flex rounded-lg border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => setAccountType("client")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            accountType === "client"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          I want to book
        </button>
        <button
          type="button"
          onClick={() => setAccountType("professional")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            accountType === "professional"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          I&apos;m a professional
        </button>
      </div>

      {state?.success && (
        <ConfirmationScreen email={state.email ?? ""} />
      )}

      {state?.error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {!state?.success && (
        <>
          <form action={action} className="space-y-4">
            <input type="hidden" name="account_type" value={accountType} />

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
              />
              {state?.fieldErrors?.full_name && (
                <p className="mt-1 text-sm text-destructive">
                  {state.fieldErrors.full_name[0]}
                </p>
              )}
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              {pending
                ? <><Spinner className="h-4 w-4" /> Creating account...</>
                : accountType === "professional"
                  ? "Create professional account"
                  : "Create account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </form>
        </>
      )}
    </>
  );
}

// ── Confirmation screen with countdown + resend ──

const COUNTDOWN_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN = 60; // 1 minute between resends

function ConfirmationScreen({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (resending || resendCooldown > 0 || !email) return;
    setResending(true);
    setResendStatus("idle");
    try {
      const result = await resendConfirmation(email);
      if (result.success) {
        setResendStatus("sent");
        setResendCooldown(RESEND_COOLDOWN);
        setSecondsLeft(COUNTDOWN_SECONDS); // reset countdown
      } else {
        setResendStatus("error");
      }
    } catch {
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  }, [email, resending, resendCooldown]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="space-y-6 text-center">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* Countdown */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Link expires in
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        {secondsLeft === 0 && (
          <p className="mt-1 text-xs text-destructive">
            Link may have expired — resend below
          </p>
        )}
      </div>

      {/* Spam notice */}
      <p className="text-sm text-muted-foreground">
        Don&apos;t see it? Check your <span className="font-medium text-foreground">spam or junk folder</span>.
        {" "}The email comes from <span className="font-medium text-foreground">hello@krowned.app</span>.
      </p>

      {/* Resend button */}
      <button
        onClick={handleResend}
        disabled={resending || resendCooldown > 0}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {resending ? (
          <>
            <Spinner className="h-4 w-4" />
            Sending...
          </>
        ) : resendCooldown > 0 ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            Resend in {resendCooldown}s
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Resend confirmation email
          </>
        )}
      </button>

      {resendStatus === "sent" && resendCooldown > 0 && (
        <p className="text-sm text-success">
          Confirmation email resent!
        </p>
      )}
      {resendStatus === "error" && (
        <p className="text-sm text-destructive">
          Failed to resend. Please try again.
        </p>
      )}

      {/* Back to login */}
      <p className="text-sm text-muted-foreground">
        Already confirmed?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
