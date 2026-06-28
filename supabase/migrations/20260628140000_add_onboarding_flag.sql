-- Add onboarding_completed_at to businesses.
-- NULL means onboarding is pending; set when the owner finishes the wizard.
alter table businesses
  add column if not exists onboarding_completed_at timestamptz;
