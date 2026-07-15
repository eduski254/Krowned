"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function ConfirmInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "signup") as "signup" | "email";

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function redirectForUser(user: { user_metadata?: Record<string, unknown> }) {
    const inviteRedirect = user.user_metadata?.invite_redirect;
    if (inviteRedirect && typeof inviteRedirect === "string" && inviteRedirect.startsWith("/")) {
      router.replace(inviteRedirect);
    } else if (user.user_metadata?.account_type === "professional") {
      router.replace("/dashboard/business/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }

  // On error, check if user already has a session (token was already used)
  async function checkExistingSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirectForUser(user);
      return true;
    }
    return false;
  }

  async function handleConfirm() {
    if (!tokenHash) {
      setStatus("error");
      setErrorMsg("Missing verification token. Please use the link from your email.");
      return;
    }

    setStatus("verifying");
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      // Token may have been consumed already (by scanner or prior click)
      const hasSession = await checkExistingSession();
      if (hasSession) return;

      setStatus("error");
      if (error.message.includes("expired") || error.message.includes("not found")) {
        setErrorMsg(
          "This link has expired or was already used. If you've already confirmed your email, try logging in.",
        );
      } else {
        setErrorMsg(error.message);
      }
      return;
    }

    setStatus("success");

    // Get user to determine redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirectForUser(user);
    } else {
      router.replace("/dashboard");
    }
  }

  // If user lands here already authenticated, just redirect
  useEffect(() => {
    checkExistingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="inline-block">
          <img src="/brand/logo-black.png" alt="Krowned" className="mx-auto h-10 w-auto dark:hidden" />
          <img src="/brand/logo-white.png" alt="Krowned" className="mx-auto hidden h-10 w-auto dark:block" />
        </Link>

        {status === "idle" && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Confirm your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tap the button below to verify your email address and activate your account.
              </p>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm my email
            </button>
          </>
        )}

        {status === "verifying" && (
          <div>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-foreground">Email verified</h2>
            <p className="mt-1 text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-foreground">Verification failed</h2>
            <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to login
              </Link>
              <Link
                href="/signup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Create a new account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      }
    >
      <ConfirmInner />
    </Suspense>
  );
}
