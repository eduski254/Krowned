-- Listing claims table for business owners to claim unclaimed listings
CREATE TABLE IF NOT EXISTS listing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  claimant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  proof_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, claimant_id)
);

-- RLS
ALTER TABLE listing_claims ENABLE ROW LEVEL SECURITY;

-- Users can see their own claims
CREATE POLICY "Users can view own claims" ON listing_claims
  FOR SELECT USING (auth.uid() = claimant_id);

-- Users can insert claims
CREATE POLICY "Users can create claims" ON listing_claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_id);

-- Super admins can view all
CREATE POLICY "Admins can view all claims" ON listing_claims
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

-- Super admins can update
CREATE POLICY "Admins can update claims" ON listing_claims
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

-- Grant access
GRANT SELECT, INSERT, UPDATE ON listing_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE ON listing_claims TO anon;
