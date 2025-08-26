
-- Create a storage bucket for meeting photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-photos', 'meeting-photos', true);

-- Create RLS policies for the meeting photos bucket
CREATE POLICY "Authenticated users can upload meeting photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view meeting photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meeting-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete meeting photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meeting-photos' AND
  auth.uid() IS NOT NULL
);

-- Update the meeting_photos table to use storage URLs instead of base64
ALTER TABLE meeting_photos 
DROP COLUMN photo_base64,
ADD COLUMN photo_url TEXT NOT NULL DEFAULT '',
ADD COLUMN file_name TEXT NOT NULL DEFAULT '',
ADD COLUMN file_size INTEGER DEFAULT 0;

-- Remove the old photo limit trigger since we'll handle it in the application
DROP TRIGGER IF EXISTS check_photo_limit_trigger ON meeting_photos;
DROP FUNCTION IF EXISTS check_photo_limit();

-- Create a new trigger function that works with the updated schema
CREATE OR REPLACE FUNCTION public.check_photo_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.meeting_photos WHERE meeting_id = NEW.meeting_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 photos allowed per meeting';
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER check_photo_limit_trigger
  BEFORE INSERT ON meeting_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_photo_limit();
