-- Add badges array to businesses for identity/accessibility/service tags
ALTER TABLE businesses ADD COLUMN badges text[] DEFAULT '{}';
