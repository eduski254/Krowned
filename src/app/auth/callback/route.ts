import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If redirecting to dashboard (default), check if professional needs onboarding
      if (next === "/dashboard") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.account_type === "professional") {
          const { data: business } = await supabase
            .from("businesses")
            .select("onboarding_completed_at")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (business && !business.onboarding_completed_at) {
            return NextResponse.redirect(
              new URL("/dashboard/business/onboarding", request.url),
            );
          }
        }
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If code exchange failed, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?message=Could+not+verify.+Please+try+again.", request.url),
  );
}
