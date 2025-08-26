
-- First, let's update the meeting_photos table to match what the code expects
ALTER TABLE public.meeting_photos 
DROP COLUMN IF EXISTS photo_base64,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create the storage bucket for meeting photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-photos', 'meeting-photos', true);

-- Create RLS policies for the storage bucket
CREATE POLICY "Authenticated users can upload meeting photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'meeting-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view meeting photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'meeting-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete meeting photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'meeting-photos' AND auth.uid() IS NOT NULL);
