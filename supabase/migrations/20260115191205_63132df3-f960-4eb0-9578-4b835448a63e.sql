-- Create table for video progress tracking
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Policies for video_progress
CREATE POLICY "Users can view their own video progress" 
ON public.video_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video progress" 
ON public.video_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video progress" 
ON public.video_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_progress_updated_at
BEFORE UPDATE ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for video_progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_progress;

-- Enable realtime for enrollments
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;