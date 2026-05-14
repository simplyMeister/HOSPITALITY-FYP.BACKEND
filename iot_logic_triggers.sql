-- 1. Automatic Bin History Snapshot
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
$$ LANGUAGE plpgsql;

-- 2. Automatic Smart Notifications (Direct from IoT)
CREATE OR REPLACE FUNCTION notify_bin_alerts()
RETURNS TRIGGER AS $$
DECLARE
    hi_name TEXT;
    gcs_id UUID;
BEGIN
    -- Only trigger if status changes to 'alert' or fill level crosses threshold
    IF (NEW.fill_level_percent >= NEW.alert_threshold AND (OLD.fill_level_percent < NEW.alert_threshold OR OLD.fill_level_percent IS NULL)) THEN
        
        -- Get Hospitality Name and GCS ID
        SELECT business_name, primary_gcs_id INTO hi_name, gcs_id 
        FROM hospitality_profiles 
        WHERE id = NEW.hospitality_id;

        -- A. Notify Hospitality
        INSERT INTO notifications (recipient_id, category, title, message, related_id)
        VALUES (
            NEW.hospitality_id,
            'operation',
            CASE WHEN NEW.fill_level_percent >= 100 THEN 'Bin Full' ELSE 'Critical Bin Saturation' END,
            CASE 
                WHEN NEW.fill_level_percent >= 100 THEN COALESCE(NEW.label, 'Unit') || ' is full.'
                ELSE 'Your ' || COALESCE(NEW.label, 'Unit') || ' is almost full (' || NEW.fill_level_percent || '%).'
            END,
            NEW.id
        );

        -- B. Notify GCS Provider
        IF gcs_id IS NOT NULL THEN
            INSERT INTO notifications (recipient_id, category, title, message, related_id)
            VALUES (
                gcs_id,
                'operation',
                CASE WHEN NEW.fill_level_percent >= 100 THEN 'Urgent: Bin Full' ELSE 'Urgent Collection Required' END,
                CASE 
                    WHEN NEW.fill_level_percent >= 100 THEN COALESCE(NEW.label, 'Unit') || ' at ' || COALESCE(hi_name, 'Partner') || ' is full.'
                    ELSE 'BIN ALMOST FULL: ' || COALESCE(NEW.label, 'Unit') || ' at ' || COALESCE(hi_name, 'Partner') || ' is at ' || NEW.fill_level_percent || '%.'
                END,
                NEW.id
            );
        END IF;

        -- Update status to alert
        NEW.status := 'alert';
    ELSIF (NEW.fill_level_percent < NEW.alert_threshold) THEN
        NEW.status := 'active';
    END IF;

    -- Fire Emergency Alert
    IF (NEW.flame_detected = TRUE AND (OLD.flame_detected = FALSE OR OLD.flame_detected IS NULL)) THEN
        INSERT INTO notifications (recipient_id, category, title, message, related_id)
        VALUES (
            NEW.hospitality_id,
            'urgent',
            '🔥 THERMAL EMERGENCY',
            'SPIKE DETECTED in Bin ' || NEW.bin_code || '. Inspect immediately.',
            NEW.id
        );
    END IF;

    -- Update last_updated timestamp automatically
    NEW.last_updated := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Triggers
DROP TRIGGER IF EXISTS tr_bin_history ON bins;
CREATE TRIGGER tr_bin_history
AFTER UPDATE ON bins
FOR EACH ROW EXECUTE FUNCTION log_bin_history();

DROP TRIGGER IF EXISTS tr_bin_alerts ON bins;
CREATE TRIGGER tr_bin_alerts
BEFORE UPDATE ON bins
FOR EACH ROW EXECUTE FUNCTION notify_bin_alerts();
