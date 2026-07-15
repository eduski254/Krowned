-- CRM Lead Acquisition & Nurture Engine (Phase 1)
-- Tables: leads, lead_emails, email_suppression, crm_settings

-- Enable extensions if not already present
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- Clean up partial apply (idempotent)
DROP TABLE IF EXISTS lead_emails CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS email_suppression CASCADE;
DROP TABLE IF EXISTS crm_settings CASCADE;

-- ── leads ────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  email           citext,
  business_name   text,
  phone           text,
  source          text,               -- 'google','yelp','manual','import'
  tags            text[] DEFAULT '{}',
  city            text,               -- stored now for Phase 2 segments
  stage           text DEFAULT 'new'   CHECK (stage IN ('new','contacted','qualified','converted')),
  nurture_status  text DEFAULT 'active' CHECK (nurture_status IN ('active','unsubscribed','completed','converted','bounced','paused')),
  nurture_step    int  DEFAULT 0,
  nurture_started_at  timestamptz,
  last_contacted_at   timestamptz,
  nurture_next_at     timestamptz,
  converted_user_id     uuid REFERENCES profiles(id),
  converted_business_id uuid REFERENCES businesses(id),
  converted_at          timestamptz,
  converted_step        int,
  notes           text,
  source_captured_at timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX leads_email_unique ON leads (lower(email::text));
CREATE INDEX leads_nurture_queue ON leads (nurture_status, nurture_next_at);
CREATE INDEX leads_stage ON leads (stage);
CREATE INDEX leads_tags ON leads USING gin (tags);
CREATE INDEX leads_business_name_trgm ON leads USING gin (business_name gin_trgm_ops);

-- Auto-update updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ── lead_emails ──────────────────────────────────────────────────────

CREATE TABLE lead_emails (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id   uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step      int  NOT NULL,
  subject   text NOT NULL,
  status    text NOT NULL CHECK (status IN ('sent','error')),
  error     text,
  resend_id text,
  sent_at   timestamptz DEFAULT now()
);

CREATE INDEX lead_emails_lead_step ON lead_emails (lead_id, step);

-- ── email_suppression (global) ───────────────────────────────────────

CREATE TABLE email_suppression (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      citext NOT NULL UNIQUE,
  reason     text NOT NULL CHECK (reason IN ('unsubscribed','bounced','complained','manual')),
  meta       jsonb,
  created_at timestamptz DEFAULT now()
);

-- ── crm_settings (singleton) ─────────────────────────────────────────

CREATE TABLE crm_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurture_paused  boolean DEFAULT false,
  daily_cap       int     DEFAULT 70,
  dry_run         boolean DEFAULT false,
  warmup_start_date date,
  updated_at      timestamptz DEFAULT now()
);

-- Seed singleton row
INSERT INTO crm_settings (id) VALUES (gen_random_uuid());

-- Auto-update updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON crm_settings
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_settings ENABLE ROW LEVEL SECURITY;

-- Super-admin full access
CREATE POLICY "Super admin full access on leads"
  ON leads FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

CREATE POLICY "Super admin full access on lead_emails"
  ON lead_emails FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

CREATE POLICY "Super admin full access on email_suppression"
  ON email_suppression FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

CREATE POLICY "Super admin full access on crm_settings"
  ON crm_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

-- Service role (cron/webhooks) has full access via service key (bypasses RLS)
-- No public read policies — intentional.

-- ── Grants ───────────────────────────────────────────────────────────

GRANT ALL ON leads TO authenticated;
GRANT ALL ON lead_emails TO authenticated;
GRANT ALL ON email_suppression TO authenticated;
GRANT ALL ON crm_settings TO authenticated;
GRANT ALL ON leads TO service_role;
GRANT ALL ON lead_emails TO service_role;
GRANT ALL ON email_suppression TO service_role;
GRANT ALL ON crm_settings TO service_role;
