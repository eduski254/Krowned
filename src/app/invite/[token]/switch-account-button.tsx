"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { createClient } from "@/lib/supabase/client";

export function SwitchAccountButton({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSwitch() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {pending ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Log out & switch account
    </button>
  );
}
