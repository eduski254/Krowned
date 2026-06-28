import { redirect } from "next/navigation";
import { getOnboardingState } from "@/lib/onboarding/actions";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const state = await getOnboardingState();

  // No business = shouldn't be here
  if (!state) redirect("/dashboard");

  // Already completed = go to dashboard
  if (state.completed) redirect("/dashboard/business");

  return (
    <div className="mx-auto max-w-lg py-4 sm:py-8">
      <OnboardingWizard
        businessId={state.business.id}
        categories={state.categories}
        savedBasics={{
          name: state.business.name ?? "",
          description: state.business.description ?? "",
          primaryCategoryId: state.business.primary_category_id ?? "",
        }}
        savedLocation={{
          address: state.business.address ?? "",
          city: state.business.city ?? "",
        }}
        savedService={
          state.service
            ? {
                name: state.service.name,
                durationMinutes: state.service.duration_minutes,
                priceAmount: state.service.price_amount,
              }
            : null
        }
      />
    </div>
  );
}
