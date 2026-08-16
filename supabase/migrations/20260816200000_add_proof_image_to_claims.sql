-- Add proof_image_url to listing_claims for document/photo uploads
ALTER TABLE listing_claims ADD COLUMN proof_image_url text;
