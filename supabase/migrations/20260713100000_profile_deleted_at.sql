-- Add deleted_at column to profiles for soft-delete with 14-day grace period
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
