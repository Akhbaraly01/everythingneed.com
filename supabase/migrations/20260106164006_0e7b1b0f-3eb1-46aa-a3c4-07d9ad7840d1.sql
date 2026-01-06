-- Fix notifications table RLS policy to prevent unauthorized insertion
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive policy that only allows users to create notifications for themselves
-- or allow service_role to create notifications for any user
CREATE POLICY "Users can create their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  auth.jwt()->>'role' = 'service_role'
);

-- Add length constraints to prevent abuse
ALTER TABLE public.health_tickets 
  ADD CONSTRAINT symptoms_max_length CHECK (length(symptoms) <= 2000),
  ADD CONSTRAINT description_max_length CHECK (length(description) <= 5000);

-- Add length constraint for medicine orders
ALTER TABLE public.medicine_orders
  ADD CONSTRAINT delivery_address_max_length CHECK (length(delivery_address) <= 500);