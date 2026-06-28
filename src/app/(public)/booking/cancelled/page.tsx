import Link from "next/link";
import { XCircle } from "lucide-react";

export default async function BookingCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>;
}) {
  const { booking_id } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>

      <h1 className="text-2xl font-bold text-foreground font-heading">
        Payment Cancelled
      </h1>
      <p className="mt-2 text-muted-foreground">
        Your payment was not completed. The time slot has been released.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/explore"
          className="flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Services
        </Link>
        <Link
          href="/dashboard/bookings"
          className="flex w-full items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          My Bookings
        </Link>
      </div>
    </div>
  );
}
