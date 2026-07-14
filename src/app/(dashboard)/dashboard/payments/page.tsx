import { PaymentMethodsClient } from "./payment-methods-client";

export default function ClientPaymentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Payment Methods
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your saved cards for faster checkout.
        </p>
      </div>

      <div className="max-w-2xl">
        <PaymentMethodsClient />
      </div>
    </div>
  );
}
