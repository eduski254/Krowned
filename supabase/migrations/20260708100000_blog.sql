-- Blog posts & comments
-- ============================================================================

-- Blog post status enum
DO $$ BEGIN
  CREATE TYPE blog_post_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text UNIQUE NOT NULL,
  excerpt     text,
  body        text NOT NULL DEFAULT '',
  cover_image_url text,
  author_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text,          -- optional override (e.g. "Zawadi Team")
  author_bio  text,          -- optional override
  author_avatar_url text,    -- optional override
  status      blog_post_status NOT NULL DEFAULT 'draft',
  tags        text[] NOT NULL DEFAULT '{}',
  meta_title  text,
  meta_description text,
  published_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Blog comments table (logged-in users only)
CREATE TABLE IF NOT EXISTS blog_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

DROP TRIGGER IF EXISTS trg_blog_comments_updated_at ON blog_comments;
CREATE TRIGGER trg_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Blog posts: anyone can read published posts
CREATE POLICY blog_posts_select_published ON blog_posts
  FOR SELECT USING (status = 'published');

-- Blog posts: super admins can do everything
CREATE POLICY blog_posts_admin_all ON blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

-- Blog comments: anyone can read comments on published posts
CREATE POLICY blog_comments_select ON blog_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM blog_posts WHERE id = post_id AND status = 'published')
  );

-- Blog comments: logged-in users can insert their own comments
CREATE POLICY blog_comments_insert ON blog_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Blog comments: users can update their own comments
CREATE POLICY blog_comments_update ON blog_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Blog comments: users can delete their own comments, admins can delete any
CREATE POLICY blog_comments_delete ON blog_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'super_admin')
  );

-- Grant access (auto_expose not enabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts TO authenticated;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_comments TO authenticated;
GRANT SELECT ON blog_comments TO anon;
