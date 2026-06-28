"use client";

import { useState, useTransition } from "react";
import { Banknote, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { createConnectOnboardingLink } from "@/lib/stripe/connect";

interface Props {
  hasConnectAccount: boolean;
  chargesEnabled: boolean;
}

export function ConnectCard({ hasConnectAccount, chargesEnabled }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const result = await createConnectOnboardingLink();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? "Failed to start onboarding.");
      }
    });
  }

  if (chargesEnabled) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Payments enabled</p>
          <p className="text-xs text-muted-foreground">
            You can accept online prepayments from clients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
          <Banknote className="h-5 w-5 text-warning" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {hasConnectAccount ? "Complete your setup" : "Accept online payments"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasConnectAccount
              ? "Your Stripe account setup is incomplete. Continue to enable payments."
              : "Connect with Stripe to accept prepayments and get payouts. Only takes a few minutes."}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <>
            {hasConnectAccount ? "Continue Setup" : "Connect with Stripe"}
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
