-- Add claimed column to businesses for the "claim listing" feature
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS claimed boolean NOT NULL DEFAULT true;

-- Index for filtering unclaimed listings
CREATE INDEX IF NOT EXISTS idx_businesses_claimed ON businesses (claimed) WHERE claimed = false;
