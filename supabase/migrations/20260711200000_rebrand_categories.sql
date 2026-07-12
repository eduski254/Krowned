-- ============================================================================
-- Krowned — Replace generic beauty categories with textured-hair niche
-- ============================================================================

-- REMAPPING:
-- hair-barber        → braids-protective (closest: general hair → braids/protective)
-- nails-beauty       → locs
-- makeup-glam        → natural-silk-press
-- skincare-aesthetics→ weaves-extensions
-- spa-massage        → barbering-cuts
-- fitness-wellness   → color
-- at-home-mobile     → DELETED (reassign to braids-protective)
-- new-category       → DELETED (reassign to braids-protective)

-- Step 1: Update existing categories in-place (preserves FK references)
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

-- Step 2: Reassign references from categories being deleted
-- at-home-mobile → braids-protective
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE category_id IN (SELECT id FROM service_categories WHERE slug = 'at-home-mobile');

UPDATE businesses SET primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE primary_category_id IN (SELECT id FROM service_categories WHERE slug = 'at-home-mobile');

DELETE FROM service_categories WHERE slug = 'at-home-mobile';

-- new-category → braids-protective
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE category_id IN (SELECT id FROM service_categories WHERE slug = 'new-category');

UPDATE businesses SET primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE primary_category_id IN (SELECT id FROM service_categories WHERE slug = 'new-category');

DELETE FROM service_categories WHERE slug = 'new-category';
