-- Create learn_posts table for social feed
CREATE TABLE public.learn_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'image', 'document')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.learn_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.learn_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE public.learn_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.learn_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create building service bookings table
CREATE TABLE public.building_service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_category TEXT NOT NULL,
  worker_type TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  estimated_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order tracking table
CREATE TABLE public.order_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('medicine', 'product', 'service')),
  user_id UUID NOT NULL,
  vendor_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  status_message TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learn_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learn_posts
CREATE POLICY "Users can view approved posts" ON public.learn_posts FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.learn_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.learn_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.learn_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for learn_post_likes
CREATE POLICY "Anyone can view likes" ON public.learn_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.learn_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.learn_post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for learn_post_comments  
CREATE POLICY "Anyone can view comments" ON public.learn_post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.learn_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.learn_post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.learn_post_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for building_service_bookings
CREATE POLICY "Users can view their bookings" ON public.building_service_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.building_service_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their bookings" ON public.building_service_bookings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for order_tracking
CREATE POLICY "Users can view their order tracking" ON public.order_tracking FOR SELECT USING (auth.uid() = user_id OR auth.uid() = vendor_id);
CREATE POLICY "Users can create order tracking" ON public.order_tracking FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = vendor_id);
CREATE POLICY "Users can update order tracking" ON public.order_tracking FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = vendor_id);

-- Enable realtime for order_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking;

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.learn_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.learn_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_likes_count
AFTER INSERT OR DELETE ON public.learn_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.learn_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.learn_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_comments_count
AFTER INSERT OR DELETE ON public.learn_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();