
-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_photos table (max 3 photos per meeting)
CREATE TABLE public.meeting_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  photo_base64 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure only authenticated admins can access data
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings table
CREATE POLICY "Authenticated users can manage meetings" 
  ON public.meetings 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Create policies for meeting_photos table
CREATE POLICY "Authenticated users can manage meeting photos" 
  ON public.meeting_photos 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Create policies for attendance table
CREATE POLICY "Authenticated users can manage attendance" 
  ON public.attendance 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Create constraint to limit max 3 photos per meeting
CREATE OR REPLACE FUNCTION check_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.meeting_photos WHERE meeting_id = NEW.meeting_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 photos allowed per meeting';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_photo_limit
  BEFORE INSERT ON public.meeting_photos
  FOR EACH ROW EXECUTE FUNCTION check_photo_limit();
