import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AccountDeletedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-6 text-2xl font-bold font-heading text-foreground">
          Account Deleted
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your account has been scheduled for deletion. Your data will be
          permanently removed after a 14-day grace period.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Changed your mind? Contact{" "}
          <a
            href="mailto:support@krowned.app"
            className="text-primary underline"
          >
            support@krowned.app
          </a>{" "}
          within 14 days to restore your account.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
