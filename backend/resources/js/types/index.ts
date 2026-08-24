export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    email_verified_at?: string;
    user_metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    user_id: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
}

export interface Product {
    id: string;
    vendor_id: string;
    name: string;
    slug: string;
    description?: string;
    category: string;
    subcategory?: string;
    price: number;
    compare_price?: number;
    image_url?: string;
    images?: string[];
    video_url?: string;
    stock_quantity: number;
    is_active: boolean;
    rating?: number;
    reviews_count?: number;
    created_at: string;
    vendor?: Vendor;
}

export interface Vendor {
    id: string;
    user_id: string;
    store_name: string;
    category: string;
    description?: string;
    is_verified: boolean;
    rating?: number;
    created_at: string;
}

export interface MedicineOrder {
    id: string;
    user_id: string;
    order_number: string;
    delivery_address: string;
    prescription_url?: string;
    total_amount: number;
    status: string;
    created_at: string;
    items?: MedicineOrderItem[];
}

export interface MedicineOrderItem {
    id: string;
    order_id: string;
    medicine_id: string;
    quantity: number;
    unit_price: number;
    medicine?: Medicine;
}

export interface Payment {
    id: string;
    user_id: string;
    order_id?: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    reference?: string;
    created_at: string;
}

export interface Refund {
    id: string;
    payment_id: string;
    amount: number;
    reason?: string;
    status: string;
    created_at: string;
}

export interface HealthTicket {
    id: string;
    patient_id: string;
    doctor_id?: string;
    ticket_number: string;
    symptoms: string;
    description?: string;
    consultation_type: string;
    consultation_fee?: number;
    appointment_date?: string;
    appointment_time?: string;
    status: string;
    priority?: string;
    created_at: string;
    doctor?: Doctor;
}

export interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    qualification: string;
    experience_years: number;
    consultation_fee: number;
    virtual_fee?: number;
    avatar_url?: string;
    is_available: boolean;
    rating?: number;
    created_at: string;
}

export interface Ticket {
    id: string;
    user_id: string;
    ticket_number: string;
    subject: string;
    priority: string;
    status: string;
    department_id?: string;
    created_at: string;
    messages?: TicketMessage[];
    department?: Department;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    sender_id: string;
    message: string;
    is_internal: boolean;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    is_active: boolean;
}

export interface Course {
    id: string;
    creator_id: string;
    title: string;
    slug: string;
    description?: string;
    category: string;
    level: string;
    type: string;
    price?: number;
    thumbnail_url?: string;
    video_url?: string;
    duration_hours?: number;
    students_count?: number;
    rating?: number;
    is_published: boolean;
    created_at: string;
    lessons?: CourseLesson[];
}

export interface CourseLesson {
    id: string;
    course_id: string;
    title: string;
    content?: string;
    video_url?: string;
    duration_minutes?: number;
    lesson_order: number;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    progress: number;
    completed_at?: string;
    course?: Course;
}

export interface Medicine {
    id: string;
    name: string;
    generic_name?: string;
    category: string;
    description?: string;
    price: number;
    image_url?: string;
    requires_prescription: boolean;
    stock_quantity: number;
    created_at: string;
}

export interface Booking {
    id: string;
    user_id: string;
    service_type: string;
    service_id: string;
    details?: Record<string, unknown>;
    status: string;
    created_at: string;
}

export interface Property {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    property_type: string;
    price: number;
    currency: string;
    bedrooms?: number;
    bathrooms?: number;
    area_sqft?: number;
    address: string;
    city: string;
    state?: string;
    country: string;
    images?: string[];
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
}

export interface JobPost {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    company: string;
    location: string;
    job_type: string;
    salary_min?: number;
    salary_max?: number;
    currency: string;
    requirements?: string[];
    benefits?: string[];
    is_active: boolean;
    expires_at?: string;
    created_at: string;
}

export interface Restaurant {
    id: string;
    name: string;
    description?: string;
    cuisine_type: string;
    address: string;
    city: string;
    phone?: string;
    image_url?: string;
    rating?: number;
    is_active: boolean;
    created_at: string;
    menu_items?: MenuItem[];
}

export interface MenuItem {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    image_url?: string;
    is_available: boolean;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    spice_level?: number;
}

export interface Hotel {
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    phone?: string;
    email?: string;
    star_rating: number;
    image_url?: string;
    amenities?: string[];
    is_active: boolean;
    created_at: string;
    rooms?: HotelRoom[];
}

export interface HotelRoom {
    id: string;
    hotel_id: string;
    room_type: string;
    price_per_night: number;
    currency: string;
    capacity: number;
    amenities?: string[];
    is_available: boolean;
    image_url?: string;
}

export interface Ride {
    id: string;
    user_id: string;
    driver_id?: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lng: number;
    status: string;
    fare?: number;
    currency: string;
    distance_km?: number;
    duration_minutes?: number;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}

export interface Plan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency: string;
    interval: string;
    features?: string[];
    is_active: boolean;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    starts_at: string;
    ends_at?: string;
    cancelled_at?: string;
    plan?: Plan;
}

export interface Review {
    id: string;
    user_id: string;
    reviewable_type: string;
    reviewable_id: string;
    rating: number;
    title?: string;
    comment?: string;
    is_verified_purchase: boolean;
    helpful_count: number;
    created_at: string;
    user?: User;
}

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
}

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    type: string;
    amount: number;
    balance_after: number;
    reference?: string;
    description?: string;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type?: string;
    related_id?: string;
    is_read: boolean;
    created_at: string;
}

export interface Address {
    id: string;
    user_id: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postal_code?: string;
    country: string;
    lat?: number;
    lng?: number;
    is_default: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface WorkerProfile {
    id: string;
    user_id: string;
    headline: string;
    bio?: string;
    category: string;
    skills?: { name: string; level?: string }[];
    experience?: { title: string; company: string; from?: string; to?: string; description?: string }[];
    education?: { institution: string; degree: string; year?: string }[];
    portfolio?: { title: string; url?: string; description?: string }[];
    hourly_rate?: number;
    daily_rate?: number;
    currency: string;
    availability: 'available' | 'busy' | 'unavailable';
    city?: string;
    country?: string;
    rating_avg: number;
    rating_count: number;
    completed_jobs: number;
    is_verified: boolean;
    user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface WorkOffer {
    id: string;
    work_request_id: string;
    worker_profile_id?: string;
    proposed_by: 'requester' | 'worker';
    rate: number;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
    created_at: string;
}

export interface WorkRequest {
    id: string;
    requester_id: string;
    worker_profile_id?: string;
    title: string;
    description?: string;
    category: string;
    location?: string;
    start_date?: string;
    estimated_duration?: string;
    budget_min?: number;
    budget_max?: number;
    currency: string;
    workers_needed: number;
    status: 'open' | 'negotiating' | 'accepted' | 'paid' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
    agreed_rate?: number;
    rated_at?: string;
    created_at: string;
    worker_profile?: WorkerProfile;
    requester?: Pick<User, 'id' | 'name' | 'email'>;
    offers?: WorkOffer[];
}
