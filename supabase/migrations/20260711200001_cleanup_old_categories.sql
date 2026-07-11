-- ============================================================================
-- Krowned — Reassign and remove old categories that still have FK references
-- ============================================================================

-- Move any services referencing at-home-mobile to braids-protective
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'at-home-mobile');

-- Move any businesses referencing at-home-mobile
UPDATE businesses SET primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE primary_category_id = (SELECT id FROM service_categories WHERE slug = 'at-home-mobile');

-- Now safe to delete
DELETE FROM service_categories WHERE slug = 'at-home-mobile';

-- Same for new-category if it exists
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'new-category');

UPDATE businesses SET primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE primary_category_id = (SELECT id FROM service_categories WHERE slug = 'new-category');

DELETE FROM service_categories WHERE slug = 'new-category';
