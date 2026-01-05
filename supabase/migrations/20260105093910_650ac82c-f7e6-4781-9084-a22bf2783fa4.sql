-- =============================================
-- DEPARTMENTS TABLE
-- =============================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role));

-- =============================================
-- TICKETS TABLE
-- =============================================
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  department_id UUID REFERENCES public.departments(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all tickets"
  ON public.tickets FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role) OR has_role(auth.uid(), 'customer_service'::app_role));

CREATE POLICY "Staff can update tickets"
  ON public.tickets FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role) OR has_role(auth.uid(), 'customer_service'::app_role));

-- =============================================
-- TICKET MESSAGES TABLE
-- =============================================
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages on their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    ) AND is_internal = false
  );

CREATE POLICY "Staff can view all messages"
  ON public.ticket_messages FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role) OR has_role(auth.uid(), 'customer_service'::app_role));

CREATE POLICY "Users can add messages to their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can add messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role) OR has_role(auth.uid(), 'customer_service'::app_role));

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- VENDORS TABLE
-- =============================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified vendors"
  ON public.vendors FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Vendors can view their own store"
  ON public.vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update their store"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create vendor profile"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors"
  ON public.vendors FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role));

-- =============================================
-- DELIVERY MANAGERS TABLE
-- =============================================
CREATE TABLE public.delivery_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 0,
  completed_deliveries INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available delivery managers"
  ON public.delivery_managers FOR SELECT
  USING (is_available = true);

CREATE POLICY "Managers can view/update their profile"
  ON public.delivery_managers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all delivery managers"
  ON public.delivery_managers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role));

-- =============================================
-- NEED CATEGORIES TABLE
-- =============================================
CREATE TABLE public.need_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.need_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view need categories"
  ON public.need_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage need categories"
  ON public.need_categories FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- NEED ITEMS TABLE
-- =============================================
CREATE TABLE public.need_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.need_categories(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.need_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available items"
  ON public.need_items FOR SELECT
  USING (is_available = true);

CREATE POLICY "Vendors can manage their items"
  ON public.need_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = vendor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all items"
  ON public.need_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role));

-- =============================================
-- COURSES TABLE
-- =============================================
CREATE TYPE public.course_type AS ENUM ('theory', 'practical', 'both');

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  course_type public.course_type NOT NULL DEFAULT 'both',
  thumbnail_url TEXT,
  video_url TEXT,
  duration_hours INT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  students_count INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role));

-- =============================================
-- COURSE LESSONS TABLE
-- =============================================
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  lesson_order INT NOT NULL DEFAULT 0,
  duration_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons"
  ON public.course_lessons FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lessons"
  ON public.course_lessons FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'category_admin'::app_role));

-- =============================================
-- USER ENROLLMENTS TABLE
-- =============================================
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- DOCTORS TABLE
-- =============================================
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INT NOT NULL DEFAULT 0,
  consultation_fee DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available doctors"
  ON public.doctors FOR SELECT
  USING (is_available = true);

CREATE POLICY "Doctors can update their profile"
  ON public.doctors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage doctors"
  ON public.doctors FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- HEALTH TICKETS TABLE
-- =============================================
CREATE TYPE public.health_ticket_status AS ENUM ('pending', 'assigned', 'in_consultation', 'completed', 'cancelled');

CREATE TABLE public.health_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  symptoms TEXT NOT NULL,
  description TEXT,
  status public.health_ticket_status NOT NULL DEFAULT 'pending',
  appointment_date DATE,
  appointment_time TIME,
  is_random_assignment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their tickets"
  ON public.health_tickets FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create tickets"
  ON public.health_tickets FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view assigned tickets"
  ON public.health_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view pending tickets for assignment"
  ON public.health_tickets FOR SELECT
  USING (
    status = 'pending' AND is_random_assignment = true AND
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors can update their assigned tickets"
  ON public.health_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all health tickets"
  ON public.health_tickets FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- MEDICINES TABLE
-- =============================================
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medicines"
  ON public.medicines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage medicines"
  ON public.medicines FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- MEDICINE ORDERS TABLE
-- =============================================
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TABLE public.medicine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their orders"
  ON public.medicine_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.medicine_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON public.medicine_orders FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- MEDICINE ORDER ITEMS TABLE
-- =============================================
CREATE TABLE public.medicine_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.medicine_orders(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medicine_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items"
  ON public.medicine_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.medicine_orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add order items"
  ON public.medicine_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medicine_orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON public.medicine_order_items FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_managers_updated_at BEFORE UPDATE ON public.delivery_managers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_need_items_updated_at BEFORE UPDATE ON public.need_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_health_tickets_updated_at BEFORE UPDATE ON public.health_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicine_orders_updated_at BEFORE UPDATE ON public.medicine_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCTION TO GENERATE TICKET NUMBERS
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

CREATE OR REPLACE FUNCTION public.generate_health_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'HTK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_health_ticket_number_trigger
  BEFORE INSERT ON public.health_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_health_ticket_number();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.medicine_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();