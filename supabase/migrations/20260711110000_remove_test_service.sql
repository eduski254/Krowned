-- Remove test/placeholder services from production data
DELETE FROM services
WHERE LOWER(TRIM(name)) = 'test'
  OR (LENGTH(TRIM(name)) < 3 AND LOWER(TRIM(name)) != '');

-- Remove test categories if any exist
DELETE FROM service_categories
WHERE slug ILIKE '%test%'
  AND NOT EXISTS (
    SELECT 1 FROM services WHERE services.category_id = service_categories.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM businesses WHERE businesses.primary_category_id = service_categories.id
  );
