"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Trash2, Star, Plus, X, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/spinner";
import {
  listPaymentMethods,
  createSetupIntent,
  removePaymentMethod,
  setDefaultPaymentMethod,
  type SavedCard,
} from "@/lib/stripe/client-payment-methods";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const BRAND_ICONS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  diners: "Diners",
  jcb: "JCB",
  unionpay: "UnionPay",
};

export function PaymentMethodsClient() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const result = await listPaymentMethods();
    if (result.error) {
      setError(result.error);
    } else {
      setCards(result.cards);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleRemove = async (pmId: string) => {
    if (!confirm("Remove this card?")) return;
    const result = await removePaymentMethod(pmId);
    if (result.success) {
      setCards((prev) => prev.filter((c) => c.id !== pmId));
    }
  };

  const handleSetDefault = async (pmId: string) => {
    const result = await setDefaultPaymentMethod(pmId);
    if (result.success) {
      setCards((prev) =>
        prev.map((c) => ({ ...c, isDefault: c.id === pmId })),
      );
    }
  };

  const handleCardAdded = () => {
    setShowAddForm(false);
    fetchCards();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card list */}
      {cards.length > 0 ? (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {BRAND_ICONS[card.brand] ?? card.brand} ···· {card.last4}
                    {card.isDefault && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <Star className="h-2.5 w-2.5 fill-primary" />
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleRemove(card.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Remove card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showAddForm ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No saved cards</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a card to speed up your next booking.
          </p>
        </div>
      ) : null}

      {/* Add card */}
      {showAddForm && stripePromise ? (
        <Elements stripe={stripePromise}>
          <AddCardForm
            onSuccess={handleCardAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </Elements>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add a card
        </button>
      )}
    </div>
  );
}

// ── Add Card Form (inside Elements provider) ──

function AddCardForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSaving(true);
    setError(null);

    // Get a SetupIntent client secret from our server
    const { clientSecret, error: siError } = await createSetupIntent();
    if (siError || !clientSecret) {
      setError(siError ?? "Failed to initialize. Please try again.");
      setSaving(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card form not ready.");
      setSaving(false);
      return;
    }

    const { error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Failed to save card.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add a card</h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg border border-input bg-background px-3 py-3">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "var(--foreground)",
                "::placeholder": { color: "var(--muted-foreground)" },
              },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !stripe}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <Spinner className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
          {saving ? "Saving..." : "Save card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
