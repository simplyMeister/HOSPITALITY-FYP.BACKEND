-- EcoTrack Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Enable pgcrypto for UUIDs (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if needed (WARNING: Drops data)
-- DROP TABLE IF EXISTS illegal_dump_reports, payments, notifications, eco_coin_transactions, waste_uploads, collections, connection_requests, bin_history, bins CASCADE;
-- DROP TABLE IF EXISTS individual_profiles, gcs_profiles, hospitality_profiles, profiles CASCADE;

-- 3. Base Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text check (role in ('admin','hospitality','gcs','individual')) not null,
  full_name text,
  email text unique not null,
  phone text,
  state text,
  lga text,
  profile_image_url text,
  is_verified boolean default false,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON profiles;
CREATE POLICY "Profiles are readable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own row" ON profiles;
CREATE POLICY "Users can update their own row" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Garbage Collection Service Profiles
CREATE TABLE IF NOT EXISTS gcs_profiles (
  id uuid references profiles(id) on delete cascade primary key,
  company_name text not null,
  rc_number text,
  year_established int,
  tagline text,
  business_type text,
  
  -- Contact & Location
  secondary_phone text,
  office_address text,
  gps_lat double precision,
  gps_lng double precision,
  website_url text,
  
  -- Coverage
  service_states text[],
  service_lgas text[],
  max_service_radius_km int,
  service_types text[],
  
  -- Capacity
  fleet_size int default 1,
  vehicle_types text[],
  worker_count int,
  max_hi_clients int,
  collection_frequency text[],
  
  -- Pricing & Payment
  pricing_model text,
  starting_price text,
  accepts_online_payment boolean default false,
  invoice_cycle text,
  
  -- Availability
  operating_hours text,
  emergency_collection boolean default false,
  avg_response_time text,
  public_holiday_coverage boolean default false,

  -- System
  is_profile_complete boolean default false,
  license_document_url text,
  is_admin_verified boolean default false,
  average_rating numeric(3,2) default 0,
  created_at timestamptz default now()
);
ALTER TABLE gcs_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read for GCS" ON gcs_profiles;
CREATE POLICY "Public read for GCS" ON gcs_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "GCS can update own profile" ON gcs_profiles;
CREATE POLICY "GCS can update own profile" ON gcs_profiles FOR UPDATE USING (auth.uid() = id);


-- 5. Hospitality Profiles
CREATE TABLE IF NOT EXISTS hospitality_profiles (
  id uuid references profiles(id) on delete cascade primary key,
  business_name text not null,
  business_type text check (business_type in ('hotel','bar','restaurant','guesthouse','resort','event_centre','other')),
  address text,
  cac_number text,
  gps_lat double precision,
  gps_lng double precision,
  primary_gcs_id uuid references gcs_profiles(id),  -- ONE-TO-ONE enforced
  accepts_eco_coins boolean default false,
  coin_discount_rate numeric(5,2) default 0,
  eco_score numeric(3,1) default 0,
  created_at timestamptz default now(),
  constraint unique_primary_gcs unique (primary_gcs_id, id)  -- 1 HI → 1 GCS
);
ALTER TABLE hospitality_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read for HI" ON hospitality_profiles;
CREATE POLICY "Public read for HI" ON hospitality_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "HI can update own profile" ON hospitality_profiles;
CREATE POLICY "HI can update own profile" ON hospitality_profiles FOR UPDATE USING (auth.uid() = id);

-- Allow GCS to update the primary_gcs_id of an HI that has a connection request with them
DROP POLICY IF EXISTS "GCS can link to HI profile" ON hospitality_profiles;
CREATE POLICY "GCS can link to HI profile" ON hospitality_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM connection_requests cr
      WHERE cr.gcs_id = auth.uid()
      AND cr.hospitality_id = hospitality_profiles.id
    )
  )
  WITH CHECK (primary_gcs_id = auth.uid() OR primary_gcs_id IS NULL);

-- 6. Individual Profiles
CREATE TABLE IF NOT EXISTS individual_profiles (
  id uuid references profiles(id) on delete cascade primary key,
  eco_coin_balance int default 0,
  total_coins_earned int default 0,
  total_coins_spent int default 0,
  created_at timestamptz default now()
);
ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Individuals can read own profile" ON individual_profiles;
CREATE POLICY "Individuals can read own profile" ON individual_profiles FOR SELECT USING (auth.uid() = id);

-- 7. Bins
CREATE TABLE IF NOT EXISTS bins (
  id uuid primary key default gen_random_uuid(),
  bin_code text unique not null,  -- e.g. "BIN_001", matches Wokwi payload bin_id
  hospitality_id uuid references hospitality_profiles(id) on delete cascade,
  label text,  -- "Kitchen Bin", "Lobby Bin"
  bin_type text check (bin_type in ('general','recyclable','organic','hazardous')),
  gps_lat double precision,
  gps_lng double precision,
  fill_level_percent numeric(5,2) default 0,
  weight_kg numeric(8,2) default 0,
  temperature_c numeric(5,2),
  humidity_percent numeric(5,2),
  flame_detected boolean default false,
  alert_threshold int default 80,
  status text check (status in ('normal','alert','collecting')) default 'normal',
  last_updated timestamptz default now(),
  last_collected_at timestamptz,
  created_at timestamptz default now()
);
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;
-- Note: A more complex policy is needed so GCS can see HI bins if connected. For now, HI sees own.
DROP POLICY IF EXISTS "HI sees own bins" ON bins;
CREATE POLICY "HI sees own bins" ON bins FOR ALL USING (hospitality_id = auth.uid());
DROP POLICY IF EXISTS "Public read for bins (temporary)" ON bins;
CREATE POLICY "Public read for bins (temporary)" ON bins FOR SELECT USING (true); -- Simplify for now until deep GCS connection logic is built

-- 8. Bin History
CREATE TABLE IF NOT EXISTS bin_history (
  id uuid primary key default gen_random_uuid(),
  bin_id uuid references bins(id) on delete cascade,
  hospitality_id uuid references hospitality_profiles(id),
  fill_level_percent numeric(5,2),
  weight_kg numeric(8,2),
  temperature_c numeric(5,2),
  flame_detected boolean,
  recorded_at timestamptz default now()
);
ALTER TABLE bin_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HI sees own bin history" ON bin_history;
CREATE POLICY "HI sees own bin history" ON bin_history FOR SELECT USING (hospitality_id = auth.uid());

-- 9. Connection Requests
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid primary key default gen_random_uuid(),
  hospitality_id uuid references hospitality_profiles(id),
  gcs_id uuid references gcs_profiles(id),
  status text check (status in ('pending','accepted','rejected')) default 'pending',
  requested_at timestamptz default now(),
  responded_at timestamptz,
  notes text,
  unique(hospitality_id)  -- HI can only have ONE active/pending request at a time
);
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HI/GCS reads connection requests" ON connection_requests;
CREATE POLICY "HI/GCS reads connection requests" ON connection_requests FOR SELECT USING (hospitality_id = auth.uid() OR gcs_id = auth.uid());

DROP POLICY IF EXISTS "HI can insert connection requests" ON connection_requests;
CREATE POLICY "HI can insert connection requests" ON connection_requests FOR INSERT WITH CHECK (hospitality_id = auth.uid());

DROP POLICY IF EXISTS "GCS can update connection status" ON connection_requests;
CREATE POLICY "GCS can update connection status" ON connection_requests FOR UPDATE USING (gcs_id = auth.uid());

DROP POLICY IF EXISTS "HI can delete own connection requests" ON connection_requests;
CREATE POLICY "HI can delete own connection requests" ON connection_requests FOR DELETE USING (hospitality_id = auth.uid());

-- 10. Collections
CREATE TABLE IF NOT EXISTS collections (
  id uuid primary key default gen_random_uuid(),
  gcs_id uuid references gcs_profiles(id),
  hospitality_id uuid references hospitality_profiles(id),
  bin_ids uuid[],
  status text check (status in ('pending','in_progress','completed')) default 'pending',
  scheduled_at timestamptz,
  completed_at timestamptz,
  collection_photo_url text,
  invoice_id uuid,
  notes text,
  created_at timestamptz default now()
);
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 11. Waste Uploads
CREATE TABLE IF NOT EXISTS waste_uploads (
  id uuid primary key default gen_random_uuid(),
  individual_id uuid references individual_profiles(id),
  waste_category text check (waste_category in ('plastic','paper','glass','metal','ewaste','organic')),
  estimated_weight_kg numeric(8,2),
  media_urls text[],  -- stored in Supabase Storage bucket
  gps_lat double precision,
  gps_lng double precision,
  description text,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  coins_awarded int default 0,
  admin_note text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);
ALTER TABLE waste_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own uploads only" ON waste_uploads;
CREATE POLICY "Own uploads only" ON waste_uploads FOR SELECT USING (individual_id = auth.uid());

-- 12. Eco Coin Transactions
CREATE TABLE IF NOT EXISTS eco_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  individual_id uuid references individual_profiles(id),
  type text check (type in ('earned','spent')),
  amount int not null,
  description text,
  hospitality_id uuid references hospitality_profiles(id),  -- if spent
  upload_id uuid references waste_uploads(id),              -- if earned
  redemption_token text unique,  -- QR code token
  token_consumed boolean default false,
  created_at timestamptz default now()
);
ALTER TABLE eco_coin_transactions ENABLE ROW LEVEL SECURITY;

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id),
  type text,
  title text,
  message text,
  is_read boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own notifications only" ON notifications;
CREATE POLICY "Own notifications only" ON notifications FOR SELECT USING (recipient_id = auth.uid());

-- 14. Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid primary key default gen_random_uuid(),
  hospitality_id uuid references hospitality_profiles(id),
  gcs_id uuid references gcs_profiles(id),
  collection_id uuid references collections(id),
  amount numeric(12,2),
  currency text default 'NGN',
  payment_reference text unique,
  gateway text check (gateway in ('paystack','flutterwave')),
  status text check (status in ('pending','successful','failed')) default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HI can read own payments" ON payments;
CREATE POLICY "HI can read own payments" ON payments FOR SELECT USING (hospitality_id = auth.uid());
DROP POLICY IF EXISTS "GCS can manage payments" ON payments;
CREATE POLICY "GCS can manage payments" ON payments FOR ALL USING (gcs_id = auth.uid());

-- 15. Illegal Dump Reports
CREATE TABLE IF NOT EXISTS illegal_dump_reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references profiles(id),
  photo_url text,
  gps_lat double precision,
  gps_lng double precision,
  description text,
  status text check (status in ('open','under_review','resolved')) default 'open',
  created_at timestamptz default now()
);
ALTER TABLE illegal_dump_reports ENABLE ROW LEVEL SECURITY;

-- 16. Trigger Function to Handle New User Signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert base profile
  INSERT INTO public.profiles (id, role, full_name, email, phone, state, lga)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'lga'
  );
  
  -- Insert into child tables based on role
  IF new.raw_user_meta_data->>'role' = 'hospitality' THEN
    INSERT INTO public.hospitality_profiles (id, business_name, business_type, address, cac_number)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'business_name', 
        new.raw_user_meta_data->>'business_type',
        new.raw_user_meta_data->>'business_address',
        new.raw_user_meta_data->>'cac_number'
    );
  ELSIF new.raw_user_meta_data->>'role' = 'gcs' THEN
    INSERT INTO public.gcs_profiles (id, company_name, service_regions)
    VALUES (new.id, new.raw_user_meta_data->>'company_name', ARRAY[new.raw_user_meta_data->>'service_area']);
  ELSIF new.raw_user_meta_data->>'role' = 'individual' THEN
    INSERT INTO public.individual_profiles (id)
    VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. Hospitality Functions
-- Function to accept EcoCoins from a user (Hospitality use case)
CREATE OR REPLACE FUNCTION accept_eco_coins(
    p_user_lookup text, -- email or phone
    p_amount int,
    p_description text,
    p_hospitality_id uuid
) RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_current_balance int;
BEGIN
    -- Find user by email or phone in profiles
    SELECT id INTO v_user_id 
    FROM profiles 
    WHERE (email = p_user_lookup OR phone = p_user_lookup) AND role = 'individual';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Individual user not found with that email/phone';
    END IF;

    -- Get current balance
    SELECT eco_coin_balance INTO v_current_balance 
    FROM individual_profiles 
    WHERE id = v_user_id;

    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient EcoCoin balance. User has %', COALESCE(v_current_balance, 0);
    END IF;

    -- Deduct balance
    UPDATE individual_profiles 
    SET eco_coin_balance = eco_coin_balance - p_amount,
        total_coins_spent = total_coins_spent + p_amount
    WHERE id = v_user_id;

    -- Record transaction
    INSERT INTO eco_coin_transactions (individual_id, type, amount, description, hospitality_id)
    VALUES (v_user_id, 'spent', p_amount, p_description, p_hospitality_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. GCS Ratings
CREATE TABLE IF NOT EXISTS gcs_ratings (
  id uuid primary key default gen_random_uuid(),
  hospitality_id uuid references hospitality_profiles(id),
  gcs_id uuid references gcs_profiles(id),
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique(hospitality_id, gcs_id)
);
ALTER TABLE gcs_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ratings are readable by all" ON gcs_ratings;
CREATE POLICY "Ratings are readable by all" ON gcs_ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "HI can rate their GCS" ON gcs_ratings;
CREATE POLICY "HI can rate their GCS" ON gcs_ratings FOR INSERT WITH CHECK (auth.uid() = hospitality_id);

-- Function to update average GCS rating
CREATE OR REPLACE FUNCTION update_gcs_average_rating()
RETURNS trigger AS $$
BEGIN
    UPDATE gcs_profiles
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM gcs_ratings
        WHERE gcs_id = NEW.gcs_id
    )
    WHERE id = NEW.gcs_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for gcs_ratings
DROP TRIGGER IF EXISTS on_gcs_rating_changed ON gcs_ratings;
CREATE TRIGGER on_gcs_rating_changed
    AFTER INSERT OR UPDATE OR DELETE ON gcs_ratings
    FOR EACH ROW EXECUTE FUNCTION update_gcs_average_rating();

-- 19. Notification Triggers
CREATE OR REPLACE FUNCTION public.notify_gcs_on_connection_request() 
RETURNS trigger AS $$
DECLARE
  v_business_name text;
BEGIN
  -- Get the business name of the HI requesting the link
  SELECT business_name INTO v_business_name 
  FROM hospitality_profiles 
  WHERE id = NEW.hospitality_id;

  -- Insert notification for the GCS
  INSERT INTO public.notifications (recipient_id, type, title, message, related_id)
  VALUES (
    NEW.gcs_id,
    'partnership_request',
    'New Partnership Request',
    v_business_name || ' requests your service for garbage cleanup.',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_request_created ON connection_requests;
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_gcs_on_connection_request();
