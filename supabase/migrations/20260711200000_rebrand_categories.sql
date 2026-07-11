-- ============================================================================
-- Krowned — Replace generic beauty categories with textured-hair niche
-- ============================================================================

-- First, update existing categories to new niche ones
UPDATE service_categories SET name = 'Braids & Protective Styling', slug = 'braids-protective', icon = 'sparkles', sort_order = 1
WHERE slug = 'hair-barber';

UPDATE service_categories SET name = 'Locs', slug = 'locs', icon = 'waves', sort_order = 2
WHERE slug = 'nails-beauty';

UPDATE service_categories SET name = 'Natural Hair & Silk Press', slug = 'natural-silk-press', icon = 'flower2', sort_order = 3
WHERE slug = 'makeup-glam';

UPDATE service_categories SET name = 'Weaves & Extensions', slug = 'weaves-extensions', icon = 'gem', sort_order = 4
WHERE slug = 'skincare-aesthetics';

UPDATE service_categories SET name = 'Barbering & Cuts', slug = 'barbering-cuts', icon = 'scissors', sort_order = 5
WHERE slug = 'spa-massage';

UPDATE service_categories SET name = 'Color', slug = 'color', icon = 'palette', sort_order = 6
WHERE slug = 'fitness-wellness';

-- Reassign any services/businesses referencing at-home-mobile before deleting
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE category_id IN (SELECT id FROM service_categories WHERE slug = 'at-home-mobile');

UPDATE businesses SET primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE primary_category_id IN (SELECT id FROM service_categories WHERE slug = 'at-home-mobile');

DELETE FROM service_categories WHERE slug = 'at-home-mobile';

-- Same for new-category placeholder
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE category_id IN (SELECT id FROM service_categories WHERE slug = 'new-category');

UPDATE businesses SET primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE primary_category_id IN (SELECT id FROM service_categories WHERE slug = 'new-category');

DELETE FROM service_categories WHERE slug = 'new-category';
