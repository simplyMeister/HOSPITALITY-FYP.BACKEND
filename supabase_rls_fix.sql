-- Run this in your Supabase SQL Editor to grant Hospitality users permission to request active pickups

CREATE POLICY "Hospitality can insert collections"
ON public.collections
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = hospitality_id
);
