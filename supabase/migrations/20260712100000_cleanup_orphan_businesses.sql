-- Clean up orphaned test business rows created during bug testing
DELETE FROM businesses WHERE slug IN ('royal-crown-braids', 'royal-crown-braids-dmv');
