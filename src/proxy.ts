import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/confirm",
  "/explore",
  "/b",
  "/book",
  "/c",
  "/how-it-works",
  "/for-professionals",
  "/for-stylists",
  "/styles",
  "/our-story",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/cookie-policy",
  "/cancellation-policy",
  "/stylist-terms",
  "/community-guidelines",
  "/accessibility",
  "/blog",
  "/invite",
  "/checkin",
  "/account-deleted",
  "/unsubscribe",
];

function isPublicPath(pathname: string) {
  // API routes handle their own auth
  if (pathname.startsWith("/api/")) return true;

  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response we can mutate
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Block soft-deleted accounts from accessing protected routes
  if (user && !isPublicPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("deleted_at")
      .eq("id", user.id)
      .single();

    if (profile?.deleted_at) {
      // Sign them out and redirect
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/account-deleted";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages (except reset-password)
  if (user && ["/login", "/signup", "/forgot-password"].some(
    (p) => pathname === p,
  )) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|site\\.webmanifest|brand/|.*\\.png$).*)",
  ],
};
