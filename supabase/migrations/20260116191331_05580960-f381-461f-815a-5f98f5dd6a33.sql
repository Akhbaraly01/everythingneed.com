-- Expert reviews table
CREATE TABLE public.expert_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expert wishlists table (favorites)
CREATE TABLE public.expert_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expert_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, expert_id)
);

-- Enable RLS
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_wishlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for expert_reviews
CREATE POLICY "Anyone can view reviews" 
ON public.expert_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews" 
ON public.expert_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.expert_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.expert_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for expert_wishlists
CREATE POLICY "Users can view their wishlist" 
ON public.expert_wishlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist" 
ON public.expert_wishlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist" 
ON public.expert_wishlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at on expert_reviews
CREATE TRIGGER update_expert_reviews_updated_at
BEFORE UPDATE ON public.expert_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();