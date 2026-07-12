-- ============================================================================
-- Krowned — Reseed demo businesses for DMV textured-hair niche
-- Replaces old Kenyan demo data with DMV businesses, services, staff, reviews.
-- Preserves test accounts (admin@/owner@/staff@/client@zawaditest.com).
-- ============================================================================

-- Clean up old demo data (services, staff, reviews, bookings, hours)
-- but preserve test user accounts in profiles/auth.users.
DELETE FROM reviews WHERE business_id IN (SELECT id FROM businesses WHERE slug NOT IN ('test-admin-biz'));
DELETE FROM bookings WHERE business_id IN (SELECT id FROM businesses);
DELETE FROM services WHERE business_id IN (SELECT id FROM businesses);
DELETE FROM staff_services;
DELETE FROM staff_schedules;
DELETE FROM staff WHERE business_id IN (SELECT id FROM businesses);
DELETE FROM business_hours WHERE business_id IN (SELECT id FROM businesses);
DELETE FROM business_contacts WHERE business_id IN (SELECT id FROM businesses);

-- Update existing businesses to DMV niche (keep owner_id intact for test accounts)
-- We'll update any businesses owned by the test owner account
UPDATE businesses
SET
  name = 'Crown & Glory Braids',
  slug = 'crown-glory-braids',
  description = 'Specializing in knotless braids, feed-ins, and protective styles. Walk-ins welcome on Saturdays.',
  city = 'Silver Spring',
  country = 'US',
  address = '8455 Colesville Rd, Silver Spring, MD 20910',
  latitude = 38.9947,
  longitude = -77.0260,
  timezone = 'America/New_York',
  is_published = true,
  is_featured = true,
  verification_status = 'verified',
  primary_category_id = (SELECT id FROM service_categories WHERE slug = 'braids-protective')
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  AND id = (SELECT id FROM businesses WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com') LIMIT 1);

-- Insert additional demo businesses
-- We need profiles first — create demo profile entries for business owners
-- (These are fake owners, not tied to real auth accounts)

DO $$
DECLARE
  v_plan_id uuid;
  v_cat_braids uuid;
  v_cat_locs uuid;
  v_cat_natural uuid;
  v_cat_weaves uuid;
  v_cat_barber uuid;
  v_cat_color uuid;
  v_biz_id uuid;
  v_staff_id uuid;
  v_owner_biz_id uuid;
  v_client_id uuid;
BEGIN
  -- Get plan and category IDs
  SELECT id INTO v_plan_id FROM plans WHERE tier = 'pro' LIMIT 1;
  SELECT id INTO v_cat_braids FROM service_categories WHERE slug = 'braids-protective';
  SELECT id INTO v_cat_locs FROM service_categories WHERE slug = 'locs';
  SELECT id INTO v_cat_natural FROM service_categories WHERE slug = 'natural-silk-press';
  SELECT id INTO v_cat_weaves FROM service_categories WHERE slug = 'weaves-extensions';
  SELECT id INTO v_cat_barber FROM service_categories WHERE slug = 'barbering-cuts';
  SELECT id INTO v_cat_color FROM service_categories WHERE slug = 'color';

  -- Get the test owner's business
  SELECT b.id INTO v_owner_biz_id
  FROM businesses b
  JOIN auth.users u ON b.owner_id = u.id
  WHERE u.email = 'owner@zawaditest.com'
  LIMIT 1;

  -- Get client user for reviews
  SELECT id INTO v_client_id FROM auth.users WHERE email = 'client@zawaditest.com';

  -- ════════════════════════════════════════════════════════════════════
  -- SERVICES for the test owner's business (Crown & Glory Braids)
  -- ════════════════════════════════════════════════════════════════════
  IF v_owner_biz_id IS NOT NULL THEN
    INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option)
    VALUES
      (v_owner_biz_id, v_cat_braids, 'Knotless Braids (Medium)', 'Medium knotless box braids, mid-back length', 25000, 'usd', 360, true, 'both'),
      (v_owner_biz_id, v_cat_braids, 'Knotless Braids (Small)', 'Small knotless braids, waist length', 35000, 'usd', 480, true, 'both'),
      (v_owner_biz_id, v_cat_braids, 'Feed-in Cornrows', 'Straight-back or custom pattern feed-ins', 12000, 'usd', 150, true, 'both'),
      (v_owner_biz_id, v_cat_braids, 'Fulani Braids', 'Fulani-style braids with beads', 18000, 'usd', 240, true, 'both'),
      (v_owner_biz_id, v_cat_braids, 'Goddess Locs (Crochet)', 'Bohemian goddess locs, crochet method', 16000, 'usd', 180, true, 'both');

    -- Staff for Crown & Glory
    INSERT INTO staff (business_id, user_id, display_name, status)
    VALUES (v_owner_biz_id, (SELECT id FROM auth.users WHERE email = 'staff@zawaditest.com'), 'Keisha M.', 'active')
    ON CONFLICT DO NOTHING;

    -- Business hours (Tue-Sat 9am-7pm)
    INSERT INTO business_hours (business_id, day_of_week, open_time, close_time)
    VALUES
      (v_owner_biz_id, 2, '09:00', '19:00'),
      (v_owner_biz_id, 3, '09:00', '19:00'),
      (v_owner_biz_id, 4, '09:00', '19:00'),
      (v_owner_biz_id, 5, '09:00', '19:00'),
      (v_owner_biz_id, 6, '09:00', '19:00')
    ON CONFLICT DO NOTHING;

    -- Reviews omitted: reviews table requires booking_id (NOT NULL) and staff_id (NOT NULL)
  END IF;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 2: Loc'd & Loaded (Locs studio in Hyattsville)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Loc''d & Loaded', 'locd-and-loaded',
    'Full-service loc studio. Starter locs, retwists, loc repairs, styles, and color on locs. Your loc journey starts here.',
    'Hyattsville', 'US', '5012 Baltimore Ave, Hyattsville, MD 20781',
    38.9554, -76.9432, 'America/New_York',
    true, true, 'verified', v_plan_id, v_cat_locs,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, primary_category_id = EXCLUDED.primary_category_id
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_locs, 'Starter Locs', 'Two-strand twist or comb coil starter locs', 20000, 'usd', 180, true, 'both'),
    (v_biz_id, v_cat_locs, 'Loc Retwist', 'Palm roll retwist with oil treatment', 8500, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_locs, 'Loc Retwist & Style', 'Retwist plus barrel curls or updo', 12000, 'usd', 120, true, 'both'),
    (v_biz_id, v_cat_locs, 'Loc Repair (per loc)', 'Reattachment or thinning repair', 1500, 'usd', 15, true, 'pay_at_store'),
    (v_biz_id, v_cat_locs, 'Faux Locs Install', 'Distressed or goddess faux locs', 22000, 'usd', 300, true, 'both');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 1, '10:00', '18:00'), (v_biz_id, 2, '10:00', '18:00'), (v_biz_id, 3, '10:00', '18:00'),
    (v_biz_id, 4, '10:00', '18:00'), (v_biz_id, 5, '10:00', '18:00'), (v_biz_id, 6, '09:00', '17:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 3: Silk & Honey Natural Hair (Silver Spring)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Silk & Honey Natural Hair', 'silk-honey-natural',
    'Natural hair care for coily and curly textures. Silk press, wash-and-go, protective styling, and deep conditioning treatments.',
    'Silver Spring', 'US', '930 Wayne Ave, Silver Spring, MD 20910',
    38.9960, -77.0263, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_natural,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_natural, 'Silk Press', 'Flat iron press on natural hair, trim included', 11000, 'usd', 120, true, 'both'),
    (v_biz_id, v_cat_natural, 'Wash & Go (Define & Go)', 'Wash, condition, define curls', 8500, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_natural, 'Deep Conditioning Treatment', 'Steam + deep condition + style', 6500, 'usd', 60, true, 'both'),
    (v_biz_id, v_cat_natural, 'Twist Out Set', 'Two-strand twist set, stretched and fluffed', 9500, 'usd', 105, true, 'both');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 2, '09:00', '18:00'), (v_biz_id, 3, '09:00', '18:00'), (v_biz_id, 4, '09:00', '19:00'),
    (v_biz_id, 5, '09:00', '19:00'), (v_biz_id, 6, '08:00', '16:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 4: Blade & Crown Barbershop (Bowie)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Blade & Crown Barbershop', 'blade-crown-barbershop',
    'Precision fades, tapers, and lineups for all textures. Walk-ins and appointments. Hot towel shaves available.',
    'Bowie', 'US', '15500 Annapolis Rd, Bowie, MD 20715',
    38.9434, -76.7310, 'America/New_York',
    true, true, 'verified', v_plan_id, v_cat_barber,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_barber, 'Skin Fade', 'Bald fade with lineup', 4000, 'usd', 40, true, 'both'),
    (v_biz_id, v_cat_barber, 'Mid Fade + Design', 'Mid fade with custom razor design', 5000, 'usd', 45, true, 'both'),
    (v_biz_id, v_cat_barber, 'Taper + Beard Trim', 'Classic taper with beard shape-up', 4500, 'usd', 40, true, 'both'),
    (v_biz_id, v_cat_barber, 'Kids Cut (Under 12)', 'Any style, patient with kids', 2500, 'usd', 30, true, 'pay_at_store'),
    (v_biz_id, v_cat_barber, 'Hot Towel Shave', 'Straight razor shave with hot towel', 3500, 'usd', 35, true, 'pay_at_store');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 1, '09:00', '18:00'), (v_biz_id, 2, '09:00', '19:00'), (v_biz_id, 3, '09:00', '19:00'),
    (v_biz_id, 4, '09:00', '19:00'), (v_biz_id, 5, '09:00', '20:00'), (v_biz_id, 6, '08:00', '17:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 5: Installs by Toni (Weaves/Extensions in DC)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Installs by Toni', 'installs-by-toni',
    'Sew-ins, wig installs, custom closure units, and frontal installs. Specializing in natural-looking results.',
    'Washington', 'US', '1342 U St NW, Washington, DC 20009',
    38.9170, -77.0310, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_weaves,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_weaves, 'Sew-In (Leave Out)', 'Traditional sew-in with natural leave-out', 18000, 'usd', 180, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Closure Sew-In', 'Full sew-in with lace closure, no leave out', 22000, 'usd', 210, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Frontal Install', 'Lace frontal install, customized and laid', 28000, 'usd', 240, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Wig Install (Glueless)', 'Glueless wig install, melt and blend', 15000, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Takedown & Reinstall', 'Remove old install, wash, and reinstall', 20000, 'usd', 150, true, 'both');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 2, '10:00', '19:00'), (v_biz_id, 3, '10:00', '19:00'), (v_biz_id, 4, '10:00', '20:00'),
    (v_biz_id, 5, '10:00', '20:00'), (v_biz_id, 6, '09:00', '18:00'), (v_biz_id, 0, '11:00', '16:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 6: The Color Room (Color specialist in Alexandria)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'The Color Room', 'the-color-room',
    'Color specialist for natural and textured hair. Balayage, vivids, highlights, and corrective color. Your texture, your shade.',
    'Alexandria', 'US', '405 E Braddock Rd, Alexandria, VA 22301',
    38.8142, -77.0580, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_color,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_color, 'Full Color (Single Process)', 'All-over color on natural hair', 15000, 'usd', 150, true, 'both'),
    (v_biz_id, v_cat_color, 'Highlights / Balayage', 'Hand-painted highlights for textured hair', 22000, 'usd', 210, true, 'both'),
    (v_biz_id, v_cat_color, 'Vivid / Fashion Color', 'Bold colors — reds, coppers, burgundy, custom', 25000, 'usd', 240, true, 'both'),
    (v_biz_id, v_cat_color, 'Loc Color', 'Full color or highlights on locs', 18000, 'usd', 180, true, 'both'),
    (v_biz_id, v_cat_color, 'Color Correction', 'Fix previous color work, consultation required', 30000, 'usd', 300, true, 'prepay');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 2, '10:00', '18:00'), (v_biz_id, 3, '10:00', '18:00'), (v_biz_id, 4, '10:00', '19:00'),
    (v_biz_id, 5, '10:00', '19:00'), (v_biz_id, 6, '09:00', '17:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 7: Braids by Nia (Largo)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Braids by Nia', 'braids-by-nia',
    'Knotless specialist. Medium, small, and jumbo knotless braids. Also offering boho braids and butterfly locs.',
    'Largo', 'US', '9500 Arena Dr, Largo, MD 20774',
    38.8857, -76.8303, 'America/New_York',
    true, true, 'verified', v_plan_id, v_cat_braids,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_braids, 'Knotless Braids (Jumbo)', 'Large knotless braids, shoulder length', 18000, 'usd', 240, true, 'both'),
    (v_biz_id, v_cat_braids, 'Knotless Braids (Medium)', 'Medium knotless, mid-back', 25000, 'usd', 360, true, 'both'),
    (v_biz_id, v_cat_braids, 'Knotless Braids (Small)', 'Small knotless, waist length', 32000, 'usd', 480, true, 'both'),
    (v_biz_id, v_cat_braids, 'Boho Braids', 'Bohemian knotless with curly ends', 28000, 'usd', 420, true, 'both'),
    (v_biz_id, v_cat_braids, 'Butterfly Locs', 'Distressed butterfly locs, bob or long', 20000, 'usd', 300, true, 'both');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 1, '08:00', '20:00'), (v_biz_id, 2, '08:00', '20:00'), (v_biz_id, 3, '08:00', '20:00'),
    (v_biz_id, 4, '08:00', '20:00'), (v_biz_id, 5, '08:00', '20:00'), (v_biz_id, 6, '08:00', '18:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 8: The Loc Bar (DC - Southeast)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'The Loc Bar', 'the-loc-bar',
    'Men and women''s loc services. Retwists, interlocks, barrel sets, loc color. Laid-back vibe, great music.',
    'Washington', 'US', '2217 MLK Jr Ave SE, Washington, DC 20020',
    38.8605, -76.9910, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_locs,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_locs, 'Retwist (Men)', 'Palm roll retwist, short-medium locs', 7500, 'usd', 60, true, 'both'),
    (v_biz_id, v_cat_locs, 'Retwist (Women)', 'Full retwist, all lengths', 9500, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_locs, 'Interlock Retwist', 'Interlocking method for tighter hold', 11000, 'usd', 120, true, 'both'),
    (v_biz_id, v_cat_locs, 'Loc Barrel Set', 'Retwist + barrel curls or pipe cleaners', 13000, 'usd', 120, true, 'both'),
    (v_biz_id, v_cat_locs, 'Starter Locs (Coils)', 'Comb coil starters, full head', 18000, 'usd', 180, true, 'both');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 2, '10:00', '19:00'), (v_biz_id, 3, '10:00', '19:00'), (v_biz_id, 4, '10:00', '19:00'),
    (v_biz_id, 5, '10:00', '20:00'), (v_biz_id, 6, '09:00', '17:00'), (v_biz_id, 0, '11:00', '16:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 9: Pressed & Blessed (Natural hair in Arlington)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Pressed & Blessed', 'pressed-and-blessed',
    'Silk press queens. Also offering natural hair cuts, treatments, and blowouts. Your curls in expert hands.',
    'Arlington', 'US', '3100 Clarendon Blvd, Arlington, VA 22201',
    38.8867, -77.0946, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_natural,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_natural, 'Silk Press', 'Flat iron press, trim, and style. Bone straight or slight body.', 13000, 'usd', 120, true, 'both'),
    (v_biz_id, v_cat_natural, 'Blowout & Trim', 'Blowout, dusting, and shaped ends', 9000, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_natural, 'Natural Hair Cut & Shape', 'Precision cut on natural hair (wet or dry)', 7500, 'usd', 60, true, 'both'),
    (v_biz_id, v_cat_natural, 'Deep Condition + Steam', 'Protein or moisture treatment with steam', 5500, 'usd', 45, true, 'pay_at_store');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 2, '09:00', '18:00'), (v_biz_id, 3, '09:00', '18:00'), (v_biz_id, 4, '09:00', '19:00'),
    (v_biz_id, 5, '09:00', '19:00'), (v_biz_id, 6, '08:00', '16:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 10: Clean Cuts DMV (Barbershop in Fairfax)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Clean Cuts DMV', 'clean-cuts-dmv',
    'Fades, tapers, and lineups done right. Appointments preferred but walk-ins accepted when available.',
    'Fairfax', 'US', '10382 Main St, Fairfax, VA 22030',
    38.8462, -77.3064, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_barber,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_barber, 'Skin Fade', 'Zero to skin fade, lined up', 3500, 'usd', 35, true, 'both'),
    (v_biz_id, v_cat_barber, 'Low Taper', 'Low taper with natural top', 3500, 'usd', 35, true, 'both'),
    (v_biz_id, v_cat_barber, 'Fade + Beard', 'Full fade with beard lineup and trim', 5000, 'usd', 45, true, 'both'),
    (v_biz_id, v_cat_barber, 'Lineup Only', 'Edge up / shape up only', 2000, 'usd', 15, true, 'pay_at_store');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 1, '09:00', '18:00'), (v_biz_id, 2, '09:00', '19:00'), (v_biz_id, 3, '09:00', '19:00'),
    (v_biz_id, 4, '09:00', '19:00'), (v_biz_id, 5, '09:00', '20:00'), (v_biz_id, 6, '08:00', '16:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 11: Snatched Studios (Weaves in Bethesda)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Snatched Studios', 'snatched-studios',
    'Luxury wig installs and sew-ins. Custom lace units, frontal installs, and maintenance. Natural-looking every time.',
    'Bethesda', 'US', '4733 Bethesda Ave, Bethesda, MD 20814',
    38.9807, -77.0956, 'America/New_York',
    true, true, 'verified', v_plan_id, v_cat_weaves,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_weaves, 'Frontal Wig Install', 'HD lace frontal, customized hairline, melted', 25000, 'usd', 180, true, 'prepay'),
    (v_biz_id, v_cat_weaves, 'Closure Wig Install', 'Closure unit install, natural part', 18000, 'usd', 120, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Full Sew-In', 'Traditional sew-in with leave out or closure', 20000, 'usd', 180, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Wig Maintenance', 'Wash, condition, and reinstall existing wig', 10000, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_weaves, 'Custom Unit Build', 'Custom wig built on order (2-3 day turnaround)', 35000, 'usd', 120, true, 'prepay');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 2, '10:00', '18:00'), (v_biz_id, 3, '10:00', '18:00'), (v_biz_id, 4, '10:00', '19:00'),
    (v_biz_id, 5, '10:00', '19:00'), (v_biz_id, 6, '09:00', '17:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════
  -- BUSINESS 12: Twisted Roots (Braids in Ashburn)
  -- ════════════════════════════════════════════════════════════════════
  INSERT INTO businesses (name, slug, description, city, country, address, latitude, longitude, timezone, is_published, is_featured, verification_status, plan_id, primary_category_id, owner_id)
  VALUES (
    'Twisted Roots', 'twisted-roots',
    'Braids and twists for the whole family. Box braids, Senegalese twists, cornrows, kids styles. Flexible scheduling for long appointments.',
    'Ashburn', 'US', '44110 Ashburn Shopping Plaza, Ashburn, VA 20147',
    39.0437, -77.4875, 'America/New_York',
    true, false, 'verified', v_plan_id, v_cat_braids,
    (SELECT id FROM auth.users WHERE email = 'owner@zawaditest.com')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
  RETURNING id INTO v_biz_id;

  INSERT INTO services (business_id, category_id, name, description, price_amount, currency, duration_minutes, is_active, payment_option) VALUES
    (v_biz_id, v_cat_braids, 'Box Braids (Medium)', 'Classic box braids, mid-back', 20000, 'usd', 300, true, 'both'),
    (v_biz_id, v_cat_braids, 'Senegalese Twists', 'Rope twists, shoulder length or longer', 18000, 'usd', 270, true, 'both'),
    (v_biz_id, v_cat_braids, 'Cornrows (Straight Back)', 'Straight-back cornrows, all sizes', 8000, 'usd', 90, true, 'both'),
    (v_biz_id, v_cat_braids, 'Cornrows (Design)', 'Custom cornrow patterns and designs', 12000, 'usd', 150, true, 'both'),
    (v_biz_id, v_cat_braids, 'Kids Braids (Under 12)', 'Box braids or cornrows for kids', 10000, 'usd', 180, true, 'pay_at_store');

  INSERT INTO business_hours (business_id, day_of_week, open_time, close_time) VALUES
    (v_biz_id, 1, '09:00', '19:00'), (v_biz_id, 2, '09:00', '19:00'), (v_biz_id, 3, '09:00', '19:00'),
    (v_biz_id, 4, '09:00', '19:00'), (v_biz_id, 5, '09:00', '20:00'), (v_biz_id, 6, '08:00', '17:00')
  ON CONFLICT DO NOTHING;

END $$;
