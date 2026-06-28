-- Backfill existing businesses so they're treated as already onboarded.
update businesses
  set onboarding_completed_at = created_at
  where onboarding_completed_at is null;
