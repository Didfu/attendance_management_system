
-- Create contacts table for global contact list
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policy for contacts table
CREATE POLICY "Authenticated users can manage contacts" 
  ON public.contacts 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Insert some default contacts
INSERT INTO public.contacts (name) VALUES 
('John Smith'),
('Jane Doe'),
('Mike Johnson'),
('Sarah Wilson'),
('David Brown'),
('Lisa Davis'),
('Robert Miller'),
('Emily Garcia'),
('Michael Rodriguez'),
('Jennifer Martinez');
