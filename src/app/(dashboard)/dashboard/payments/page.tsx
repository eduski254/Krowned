import { EmptyState } from "@/components/dashboard/empty-state";
import { CreditCard } from "lucide-react";

export default function ClientPaymentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Payment Methods
      </h1>

      {/* // REVIEW: Stripe Customer portal integration needed here.
          // Will list saved cards via Stripe API and allow adding/removing.
          // Requires profiles.stripe_customer_id to be set. */}
      <EmptyState
        icon={CreditCard}
        title="No payment methods"
        description="Your saved payment methods will appear here once you make your first online booking."
      />
    </div>
  );
}
