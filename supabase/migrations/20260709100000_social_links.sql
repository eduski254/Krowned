-- Add social_links jsonb column to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN businesses.social_links IS 'Social media URLs: { instagram, facebook, twitter, linkedin, tiktok, website }';
