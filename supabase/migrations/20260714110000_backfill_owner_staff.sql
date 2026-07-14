-- Backfill: create staff records for business owners who completed onboarding
-- but have no staff row yet (solo pros need a staff record for the booking engine)

-- 1. Insert staff rows for owners missing one
INSERT INTO staff (business_id, user_id, display_name, status)
SELECT b.id, b.owner_id, COALESCE(p.full_name, 'Owner'), 'active'
FROM businesses b
JOIN profiles p ON p.id = b.owner_id
WHERE b.onboarding_completed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM staff s WHERE s.business_id = b.id AND s.user_id = b.owner_id
  );

-- 2. Link those new staff to all active services in their business
INSERT INTO staff_services (staff_id, service_id)
SELECT s.id, svc.id
FROM staff s
JOIN businesses b ON b.id = s.business_id AND b.owner_id = s.user_id
JOIN services svc ON svc.business_id = b.id AND svc.is_active = true
WHERE b.onboarding_completed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM staff_services ss WHERE ss.staff_id = s.id AND ss.service_id = svc.id
  );

-- 3. Create default Mon-Sat 9am-5pm schedules for those staff
INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time)
SELECT s.id, d.dow, '09:00', '17:00'
FROM staff s
JOIN businesses b ON b.id = s.business_id AND b.owner_id = s.user_id
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS d(dow)
WHERE b.onboarding_completed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM staff_schedules ss WHERE ss.staff_id = s.id AND ss.day_of_week = d.dow
  );
