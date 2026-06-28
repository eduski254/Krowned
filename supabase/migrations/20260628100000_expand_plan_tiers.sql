-- Step 1: Add new enum values to plan_tier.
-- These must be committed before they can be used in DML statements.
alter type plan_tier add value if not exists 'starter';
alter type plan_tier add value if not exists 'pro';
alter type plan_tier add value if not exists 'enterprise';
