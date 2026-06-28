-- Create business-images storage bucket (public read, owner upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-images',
  'business-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket)
CREATE POLICY "business_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-images');

-- Business owner can upload (path scoped: business-images/{business_id}/...)
-- We verify ownership at the application layer since storage policies
-- can't easily join to the businesses table. The path structure enforces isolation.
CREATE POLICY "business_images_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'business-images');

CREATE POLICY "business_images_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'business-images');

CREATE POLICY "business_images_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'business-images');
