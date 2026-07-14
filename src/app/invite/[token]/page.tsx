import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AcceptInviteButton } from "./accept-button";
import { SwitchAccountButton } from "./switch-account-button";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Look up the invite
  const { data: staff } = await admin
    .from("staff")
    .select("id, display_name, invited_email, invite_expires_at, status, business_id, businesses(name)")
    .eq("invite_token", token)
    .maybeSingle();

  if (!staff) notFound();

  // Already accepted
  if (staff.status === "active") {
    return (
      <div className="mx-auto max-w-md py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Already accepted
        </h1>
        <p className="mt-2 text-muted-foreground">
          This invitation has already been accepted.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Log in
        </Link>
      </div>
    );
  }

  // Expired
  if (
    staff.invite_expires_at &&
    new Date(staff.invite_expires_at) < new Date()
  ) {
    return (
      <div className="mx-auto max-w-md py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Invitation expired
        </h1>
        <p className="mt-2 text-muted-foreground">
          This invitation link has expired. Please ask the business owner to
          send a new one.
        </p>
      </div>
    );
  }

  // Revoked / inactive
  if (staff.status !== "invited") {
    return (
      <div className="mx-auto max-w-md py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Invitation unavailable
        </h1>
        <p className="mt-2 text-muted-foreground">
          This invitation is no longer valid.
        </p>
      </div>
    );
  }

  const businessName =
    (staff.businesses as unknown as { name: string } | null)?.name ??
    "a business";

  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, show accept button
  if (user) {
    // Verify email matches
    const emailMatch =
      user.email?.toLowerCase() === staff.invited_email?.toLowerCase();

    if (!emailMatch) {
      return (
        <div className="mx-auto max-w-md py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground font-heading">
            Email mismatch
          </h1>
          <p className="mt-2 text-muted-foreground">
            This invitation was sent to{" "}
            <strong>{staff.invited_email}</strong>, but you&apos;re logged in as{" "}
            <strong>{user.email}</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Log out and sign in with the correct email to accept.
          </p>
          <div className="mt-6">
            <SwitchAccountButton redirectTo={`/invite/${token}`} />
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Join {businessName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {staff.display_name}, you&apos;ve been invited to join{" "}
          <strong>{businessName}</strong> as a team member on Krowned.
        </p>
        <AcceptInviteButton token={token} />
      </div>
    );
  }

  // Not logged in — prompt to sign up or log in
  return (
    <div className="mx-auto max-w-md py-16 px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground font-heading">
        Join {businessName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {staff.display_name}, you&apos;ve been invited to join{" "}
        <strong>{businessName}</strong> as a team member on Krowned.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Create an account or log in with <strong>{staff.invited_email}</strong>{" "}
        to accept.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={`/signup?redirect=/invite/${token}`}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Create account
        </Link>
        <Link
          href={`/login?redirect=/invite/${token}`}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
