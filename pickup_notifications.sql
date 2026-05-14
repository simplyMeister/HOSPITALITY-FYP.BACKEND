-- Function to notify GCS when a Hospitality partner requests a pickup
CREATE OR REPLACE FUNCTION public.notify_gcs_on_pickup_request() 
RETURNS trigger AS $$
DECLARE
  v_business_name text;
BEGIN
  -- Get the business name of the HI requesting the pickup
  SELECT business_name INTO v_business_name 
  FROM hospitality_profiles 
  WHERE id = NEW.hospitality_id;

  -- Insert notification for the GCS
  INSERT INTO public.notifications (recipient_id, type, title, message, related_id)
  VALUES (
    NEW.gcs_id,
    'pickup_request',
    'New Pickup Request',
    v_business_name || ' has requested an ad-hoc garbage pickup.',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for collections table
DROP TRIGGER IF EXISTS on_pickup_request_created ON collections;
CREATE TRIGGER on_pickup_request_created
  AFTER INSERT ON collections
  FOR EACH ROW 
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_gcs_on_pickup_request();

-- Also notify HI when GCS accepts or completes the request
CREATE OR REPLACE FUNCTION public.notify_hi_on_collection_update() 
RETURNS trigger AS $$
DECLARE
  v_gcs_name text;
BEGIN
  -- Get the company name of the GCS
  SELECT company_name INTO v_gcs_name 
  FROM gcs_profiles 
  WHERE id = NEW.gcs_id;

  -- Notify user of acceptance
  IF NEW.status = 'in_progress' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (recipient_id, type, title, message, related_id)
    VALUES (
      NEW.hospitality_id,
      'operation',
      'Pickup Accepted',
      v_gcs_name || ' has accepted your pickup request and is en route.',
      NEW.id
    );
  ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    INSERT INTO public.notifications (recipient_id, type, title, message, related_id)
    VALUES (
      NEW.hospitality_id,
      'operation',
      'Pickup Completed',
      v_gcs_name || ' has completed the garbage collection.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for status updates
DROP TRIGGER IF EXISTS on_collection_status_updated ON collections;
CREATE TRIGGER on_collection_status_updated
  AFTER UPDATE OF status ON collections
  FOR EACH ROW EXECUTE FUNCTION public.notify_hi_on_collection_update();
