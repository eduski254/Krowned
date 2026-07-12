-- ============================================================================
-- Clean slate: remove ALL business/booking/review/staff data.
-- Preserves: auth.users, profiles, plans, service_categories, blog_posts.
-- ============================================================================

-- Order matters due to FK constraints
DELETE FROM review_responses;
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM staff_services;
DELETE FROM staff_schedules;
DELETE FROM schedule_exceptions;
DELETE FROM staff;
DELETE FROM services;
DELETE FROM business_hours;
DELETE FROM business_contacts;
DELETE FROM favorites;
DELETE FROM conversations;
DELETE FROM conversation_participants;
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM notification_preferences;
DELETE FROM businesses;
