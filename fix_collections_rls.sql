-- Final Fix for Collections RLS
-- This ensures GCS and HI can interact with collection records without security violations

-- 1. Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "GCS can insert collections" ON public.collections;
DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
DROP POLICY IF EXISTS "GCS can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "GCS can manage collections" ON public.collections;
DROP POLICY IF EXISTS "HI can view their collections" ON public.collections;
DROP POLICY IF EXISTS "Admins have full access to collections" ON public.collections;

-- 3. Create granular policies

-- A: Allow GCS providers to log/insert new collections
CREATE POLICY "GCS can insert collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() = gcs_id);

-- B: Allow both GCS and HI to VIEW collection history
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (auth.uid() = gcs_id OR auth.uid() = hospitality_id);

-- C: Allow GCS to UPDATE status (e.g., mark as completed)
CREATE POLICY "GCS can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() = gcs_id)
WITH CHECK (auth.uid() = gcs_id);

-- D: (Optional) Allow Admins full access
CREATE POLICY "Admins have full access to collections" 
ON public.collections 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Fix Bins table so GCS can reset levels after collection
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GCS can update linked bins" ON public.bins;
CREATE POLICY "GCS can update linked bins" 
ON public.bins 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM hospitality_profiles hp
    WHERE hp.id = bins.hospitality_id
    AND hp.primary_gcs_id = auth.uid()
  )
);

-- (Keep existing bin policies for HI)
DROP POLICY IF EXISTS "HI manage own bins" ON public.bins;
CREATE POLICY "HI manage own bins" ON public.bins FOR ALL USING (hospitality_id = auth.uid());
