-- Add consultation_type and virtual_fee to health_tickets
ALTER TABLE public.health_tickets 
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;

-- Add virtual consultation fee to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS virtual_fee NUMERIC DEFAULT 0;

-- Update existing doctors with virtual fees (30% less than physical)
UPDATE public.doctors 
SET virtual_fee = ROUND(consultation_fee * 0.7)
WHERE virtual_fee = 0 OR virtual_fee IS NULL;

-- Create expert_availability table for real-time availability
CREATE TABLE IF NOT EXISTS public.expert_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id TEXT NOT NULL,
  expert_type TEXT NOT NULL DEFAULT 'doctor',
  is_available BOOLEAN DEFAULT true,
  next_available_at TIMESTAMP WITH TIME ZONE,
  current_status TEXT DEFAULT 'available',
  status_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;

-- Everyone can read availability
CREATE POLICY "Anyone can view expert availability" 
ON public.expert_availability 
FOR SELECT 
USING (true);

-- Enable realtime for expert availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_availability;

-- Create sample posts for the learn feed if empty
INSERT INTO public.learn_posts (user_id, title, content, category, status, author_name, is_featured, likes_count, comments_count)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  title,
  content,
  category,
  'approved',
  author_name,
  is_featured,
  likes_count,
  comments_count
FROM (VALUES 
  ('Master React in 30 Days', 'Complete guide to learning React from scratch. Includes hooks, context, and advanced patterns. Perfect for beginners who want to become proficient developers.', 'Technology', 'Dr. Sarah Chen', true, 245, 38),
  ('Introduction to Machine Learning', 'Understanding the basics of ML algorithms, neural networks, and practical applications in everyday technology. Join thousands of students worldwide.', 'Technology', 'Prof. James Wilson', true, 189, 27),
  ('Digital Marketing Essentials', 'Learn SEO, social media marketing, content strategy, and paid advertising. Build your brand online with proven techniques.', 'Marketing', 'Maria Rodriguez', false, 156, 22),
  ('Sustainable Agriculture Practices', 'Modern farming techniques that protect the environment while maximizing yield. Covers crop rotation, organic methods, and smart irrigation.', 'Agriculture', 'Dr. Ahmed Hassan', true, 134, 19),
  ('Financial Planning for Beginners', 'Build wealth through smart investing, budgeting, and understanding compound interest. Start your journey to financial freedom.', 'Finance', 'Jennifer Williams', false, 178, 31),
  ('Blockchain & Cryptocurrency 101', 'Demystifying blockchain technology, smart contracts, and the future of decentralized finance. No technical background required.', 'Blockchain', 'Michael Chen', true, 203, 42),
  ('Healthcare Innovation Trends', 'Exploring telemedicine, AI diagnostics, and personalized medicine. The future of healthcare is here.', 'Healthcare', 'Dr. Emily Park', false, 98, 15),
  ('Business Strategy Masterclass', 'Strategic thinking, competitive analysis, and growth hacking for startups and enterprises alike.', 'Business', 'Robert Thompson', true, 167, 28),
  ('UI/UX Design Principles', 'Create beautiful and functional interfaces. Learn design thinking, prototyping, and user research methods.', 'Design', 'Anna Kowalski', false, 145, 21),
  ('Python for Data Science', 'Hands-on data analysis with Python, pandas, and visualization. Transform raw data into actionable insights.', 'Technology', 'Dr. David Liu', true, 234, 45)
) AS posts(title, content, category, author_name, is_featured, likes_count, comments_count)
WHERE NOT EXISTS (SELECT 1 FROM public.learn_posts LIMIT 1);