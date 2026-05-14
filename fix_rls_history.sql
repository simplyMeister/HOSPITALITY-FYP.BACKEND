-- Fix RLS for bin_history and triggers
ALTER TABLE public.bin_history DISABLE ROW LEVEL SECURITY;
-- Or alternatively, add a policy that allows the system to insert
-- ALTER TABLE public.bin_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "System can insert history" ON public.bin_history FOR INSERT WITH CHECK (true);

-- Ensure the trigger functions run with system permissions (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION log_bin_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO bin_history (
        bin_id, 
        hospitality_id, 
        fill_level_percent, 
        weight_kg, 
        flame_detected
    )
    VALUES (
        NEW.id, 
        NEW.hospitality_id, 
        NEW.fill_level_percent, 
        NEW.weight_kg, 
        NEW.flame_detected
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- This is the magic fix

CREATE OR REPLACE FUNCTION notify_bin_alerts()
RETURNS TRIGGER AS $$
DECLARE
    hi_name TEXT;
    gcs_id UUID;
BEGIN
    IF (NEW.fill_level_percent >= NEW.alert_threshold AND (OLD.fill_level_percent < NEW.alert_threshold OR OLD.fill_level_percent IS NULL)) THEN
        SELECT business_name, primary_gcs_id INTO hi_name, gcs_id 
        FROM hospitality_profiles 
        WHERE id = NEW.hospitality_id;

        INSERT INTO notifications (recipient_id, category, title, message, related_id)
        VALUES (NEW.hospitality_id, 'operation', 'Critical Bin Saturation', 'Your Unit is full.', NEW.id);

        IF gcs_id IS NOT NULL THEN
            INSERT INTO notifications (recipient_id, category, title, message, related_id)
            VALUES (gcs_id, 'operation', 'Urgent Collection Required', 'BIN FULL at Partner.', NEW.id);
        END IF;
        NEW.status := 'alert';
    ELSIF (NEW.fill_level_percent < NEW.alert_threshold) THEN
        NEW.status := 'active';
    END IF;

    IF (NEW.flame_detected = TRUE AND (OLD.flame_detected = FALSE OR OLD.flame_detected IS NULL)) THEN
        INSERT INTO notifications (recipient_id, category, title, message, related_id)
        VALUES (NEW.hospitality_id, 'urgent', '🔥 THERMAL EMERGENCY', 'SPIKE DETECTED!', NEW.id);
    END IF;

    NEW.last_updated := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- This is the magic fix
