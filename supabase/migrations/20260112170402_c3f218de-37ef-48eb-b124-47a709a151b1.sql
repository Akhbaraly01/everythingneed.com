-- Chat messages table for customer-worker communication
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.building_service_bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  worker_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User certificates/enrollments for courses
CREATE TABLE public.user_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  course_title TEXT NOT NULL,
  instructor_name TEXT NOT NULL
);

-- Direct messages for learn section (like Facebook messenger)
CREATE TABLE public.learn_direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  post_id UUID REFERENCES public.learn_posts(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service workers table
CREATE TABLE public.service_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  worker_type TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  hourly_rate NUMERIC(10,2),
  bio TEXT,
  avatar_url TEXT,
  completed_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add video support to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS production_video_url TEXT;

-- Add media support to learn_posts
ALTER TABLE public.learn_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.learn_posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.learn_posts ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE public.learn_posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.learn_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.learn_posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_workers ENABLE ROW LEVEL SECURITY;

-- Chat conversations policies
CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = worker_id);

CREATE POLICY "Users can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
      AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id
      AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
      AND (customer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

-- User certificates policies
CREATE POLICY "Users can view their own certificates"
  ON public.user_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create certificates"
  ON public.user_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Direct messages policies
CREATE POLICY "Users can view their own DMs"
  ON public.learn_direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send DMs"
  ON public.learn_direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received DMs"
  ON public.learn_direct_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Service workers policies
CREATE POLICY "Anyone can view available workers"
  ON public.service_workers FOR SELECT
  USING (true);

CREATE POLICY "Workers can manage their own profile"
  ON public.service_workers FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learn_direct_messages;

-- Generate certificate number function
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_certificate_number_trigger
  BEFORE INSERT ON public.user_certificates
  FOR EACH ROW EXECUTE FUNCTION public.generate_certificate_number();

-- Update triggers
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_workers_updated_at
  BEFORE UPDATE ON public.service_workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();