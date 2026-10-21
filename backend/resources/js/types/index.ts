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

/** Server-computed workspace context (HandleInertiaRequests). */
export interface WorkspaceProps {
    current: 'marketplace' | 'admin' | 'vendor' | 'provider';
    available: string[];
    landing: string;
    /** Admin route hrefs this user's roles may open (from route role: middleware). */
    adminHrefs: string[];
}

/** One DB-driven menu entry (spec S46; shared `siteNav` Inertia prop). */
export interface SiteNavItem {
    id: string;
    title: string;
    url: string;
    icon?: string | null;
    /** '_blank' when the admin enabled open-in-new-tab. */
    target?: string | null;
    /** null = all devices; otherwise subset of ['desktop', 'mobile']. */
    devices?: string[] | null;
    children?: SiteNavItem[];
}

/** Menus by location for the current viewer (guest/auth/role filtered). */
export interface SiteNav {
    header?: SiteNavItem[];
    footer?: SiteNavItem[];
    mobile?: SiteNavItem[];
    category?: SiteNavItem[];
    more?: SiteNavItem[];
}

/** Uniform card payload for Home vertical rails (spec S8). */
export interface HomeSectionItem {
    id: string | number;
    title: string;
    subtitle?: string | null;
    image?: string | null;
    url: string;
    badge?: string | null;
    price?: number | null;
    rating?: number | null;
}

/** Spec S13 need-request lifecycle (spec S10/S12/S14 pages). */
export type NeedStatus =
    | 'draft'
    | 'pending'
    | 'published'
    | 'reviewing'
    | 'offered'
    | 'negotiating'
    | 'accepted'
    | 'payment_pending'
    | 'paid'
    | 'in_progress'
    | 'fulfilled'
    | 'completed'
    | 'cancelled'
    | 'rejected'
    | 'expired'
    | 'disputed'
    | 'refunded';

export interface NeedCategoryFormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'boolean';
    required: boolean;
    options?: string[];
}

export interface NeedCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    parent_id?: string | null;
    is_active?: boolean;
    form_schema?: NeedCategoryFormField[] | null;
    form_schema_version?: number | null;
    children?: NeedCategory[];
}

export interface NeedOffer {
    id: string;
    provider_id: string;
    provider?: { id: string; name: string } | null;
    price: number | string;
    message?: string | null;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
    provider_is_available?: boolean | null;
    provider_profile_status?: string | null;
    created_at: string;
}

export interface NeedTimelineEvent {
    id: string;
    from_status?: NeedStatus | null;
    to_status: NeedStatus;
    action: string;
    note?: string | null;
    created_at: string;
    actor?: { id: string; name: string } | null;
}

export interface NeedPaymentSummary {
    reference: string;
    amount: number | string;
    currency?: string;
    status: string;
    created_at?: string;
}

export interface NeedRequestDetail {
    id: string;
    user_id: string;
    category_id?: string | null;
    request_number: string;
    title: string;
    description: string;
    subcategory?: string | null;
    budget_min?: number | string | null;
    budget_max?: number | string | null;
    quantity?: number | null;
    currency?: string;
    country?: string | null;
    location?: string | null;
    preferred_date?: string | null;
    deadline?: string | null;
    attachments?: string[] | null;
    images?: string[] | null;
    service_requirements?: string | null;
    delivery_requirements?: string | null;
    notes?: string | null;
    answers?: Record<string, unknown> | null;
    form_schema_snapshot?: NeedCategoryFormField[] | null;
    pricing_basis?: string | null;
    is_remote?: boolean | null;
    state?: string | null;
    lga?: string | null;
    city?: string | null;
    is_asap?: boolean | null;
    preferred_time_window?: string | null;
    visibility?: string | null;
    invited_provider_ids?: string[] | null;
    status: NeedStatus;
    category?: NeedCategory | null;
    user?: { id: string; name: string } | null;
    offers?: NeedOffer[];
    timeline?: NeedTimelineEvent[];
    payment?: NeedPaymentSummary | null;
    created_at: string;
}

export interface Profile {
    id: string;
    user_id: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
}

export interface ProductVariant {
    id: string;
    product_id?: string;
    name: string;
    sku?: string | null;
    price: number | string;
    stock_quantity: number;
    attributes?: Record<string, string> | null;
    is_active: boolean;
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
    video_url?: string | null;
    production_video_url?: string | null;
    stock_quantity: number;
    is_active: boolean;
    rating?: number;
    reviews_count?: number;
    variants?: ProductVariant[];
    created_at: string;
    vendor?: Vendor;
    /** Catalogue extras used by the product page. */
    sku?: string | null;
    currency?: string | null;
    tax_rate?: number | string | null;
    discount_percent?: number | string | null;
    specifications?: Record<string, unknown> | null;
    attributes?: Record<string, unknown> | null;
    shipping?: Record<string, unknown> | null;
}

export interface Vendor {
    id: string;
    user_id: string;
    store_name: string;
    slug?: string;
    category: string;
    description?: string;
    is_verified: boolean;
    rating?: number;
    settings?: { accepting_orders?: boolean } | null;
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

export interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: { id?: string; image_url?: string };
    variant?: { name?: string } | null;
    product_id?: string;
}

export interface TrackingEvent {
    id: string;
    status: string;
    status_message?: string | null;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    subtotal: number;
    discount: number;
    shipping_fee: number;
    tax?: number | string;
    total_amount: number;
    shipping_address?: string;
    shipping_city?: string;
    shipping_country?: string;
    tracking?: TrackingEvent[];
    items?: OrderItem[];
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
    course_type?: string;
    instructor_name?: string | null;
    objectives?: string[] | null;
    requirements?: string | null;
    language?: string | null;
    price?: number;
    thumbnail_url?: string;
    video_url?: string;
    duration_hours?: number;
    students_count?: number;
    rating?: number;
    reviews_count?: number;
    is_published: boolean;
    is_featured?: boolean;
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
    resources?: { title: string; url: string }[] | null;
    is_free_preview?: boolean;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    progress: number;
    completed_at?: string;
    last_active_at?: string | null;
    lessons_count?: number;
    completed_lessons?: number;
    is_completed?: boolean;
    course?: Course;
}

export interface CourseQuiz {
    id: string;
    title: string;
    pass_score_percent?: number;
    passed?: boolean;
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

export interface Flight {
    id: string;
    flight_number: string;
    airline: string;
    origin_city: string;
    origin_code: string;
    destination_city: string;
    destination_code: string;
    departure_time?: string;
    arrival_time?: string;
    duration_minutes: number;
    price: number | string;
    seats_total: number;
    seats_available: number;
    days_of_week?: number[];
    is_active: boolean;
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
    type?: string;
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
    /** N-32 attached company profile (serializes from companyProfile()). */
    company_profile?: {
        id?: string;
        name?: string;
        slug?: string;
        industry?: string | null;
        location?: string | null;
        website?: string | null;
        logo_path?: string | null;
    } | null;
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
    status?: 'approved' | 'pending' | 'hidden' | 'rejected';
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

export interface KycVerification {
    id?: string;
    user_id?: string;
    status: string;
    verification_state: string;
    document_type?: string | null;
    document_number_masked?: string | null;
    full_name?: string | null;
    nationality?: string | null;
    rejection_reason?: string | null;
    attempts?: number;
    submitted_at?: string | null;
    reviewed_at?: string | null;
    verified_at?: string | null;
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
