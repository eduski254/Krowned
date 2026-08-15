-- Add photos column to reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;

-- Create review-images storage bucket (public, 5MB limit, image types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket)
CREATE POLICY "review_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

-- Authenticated users can upload to review-images/
CREATE POLICY "review_images_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-images');

-- Authenticated users can update their uploads
CREATE POLICY "review_images_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'review-images');

-- Authenticated users can delete their uploads
CREATE POLICY "review_images_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'review-images');

-- Grant access to the new column
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
