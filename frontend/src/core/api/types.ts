/**
 * PostgreSQL database types. Framework-agnostic — maps 1:1 to
 * Laravel 13 Eloquent models.
 *
 * Laravel mapping: each table → an Eloquent model in Modules/<Name>/Entities/
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ──────────────────────────────────────────────────────────
export type AppRole = "super_admin" | "category_admin" | "customer_service" | "user";
export type CourseType = "theory" | "practical" | "both";
export type HealthTicketStatus = "pending" | "assigned" | "in_consultation" | "completed" | "cancelled";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded" | "partially_refunded";
export type RefundStatus = "pending" | "approved" | "rejected" | "completed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed";
export type WalletTransactionType = "credit" | "debit";

// ── Table Row types (read models) ──────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_type: string;
  service_id: string | null;
  details: Json;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingServiceBooking {
  id: string;
  user_id: string;
  worker_type: string;
  service_category: string;
  description: string;
  address: string;
  scheduled_date: string;
  scheduled_time: string | null;
  estimated_cost: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  medicine_id: string;
  quantity: number;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  customer_id: string;
  worker_id: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  lesson_order: number;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  course_type: CourseType;
  instructor_name: string;
  price: number;
  thumbnail_url: string | null;
  video_url: string | null;
  duration_hours: number | null;
  students_count: number;
  rating: number | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryManager {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string | null;
  is_available: boolean;
  completed_deliveries: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  virtual_fee: number | null;
  avatar_url: string | null;
  is_available: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed_at: string | null;
  created_at: string;
}

export interface ExpertAvailability {
  id: string;
  expert_id: string;
  expert_type: string;
  current_status: string | null;
  is_available: boolean | null;
  status_message: string | null;
  next_available_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ExpertReview {
  id: string;
  expert_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertWishlist {
  id: string;
  user_id: string;
  expert_id: string;
  created_at: string;
}

export interface HealthTicket {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  ticket_number: string;
  symptoms: string;
  description: string | null;
  consultation_type: string | null;
  consultation_fee: number | null;
  appointment_date: string | null;
  appointment_time: string | null;
  is_random_assignment: boolean;
  status: HealthTicketStatus;
  created_at: string;
  updated_at: string;
}

export interface LearnDirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface LearnPostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LearnPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface LearnPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  author_name: string | null;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_featured: boolean | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MedicineOrderItem {
  id: string;
  order_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface MedicineOrder {
  id: string;
  user_id: string;
  order_number: string;
  delivery_address: string;
  prescription_url: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  description: string | null;
  price: number;
  image_url: string | null;
  requires_prescription: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface NeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface NeedItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
  vendor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  order_type: string;
  user_id: string;
  vendor_id: string | null;
  status: string;
  status_message: string | null;
  estimated_delivery: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean | null;
  helpful_count: number | null;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  production_video_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  rating: number | null;
  reviews_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceWorker {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  worker_type: string;
  bio: string | null;
  avatar_url: string | null;
  hourly_rate: number | null;
  experience_years: number | null;
  completed_jobs: number | null;
  is_available: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCertificate {
  id: string;
  user_id: string;
  course_id: string | null;
  course_title: string;
  instructor_name: string;
  certificate_number: string;
  issued_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  category_id: string | null;
  created_at: string;
}

export interface VendorOrder {
  id: string;
  vendor_id: string;
  customer_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_number: string;
  shipping_address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  category: string;
  description: string | null;
  is_verified: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  last_position_seconds: number | null;
  watch_time_seconds: number | null;
  progress_percent: number | null;
  completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  reference: string;
  gateway_response: Json | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount: number;
  reason: string | null;
  status: RefundStatus;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  reference: string;
  description: string | null;
  created_at: string;
}

// ── Insert types (create models) ───────────────────────────────────
// Makes id, created_at, updated_at optional for inserts

export type AuditLogInsert = Omit<AuditLog, "id" | "created_at"> & { id?: string; created_at?: string };
export type BookingInsert = Omit<Booking, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type BuildingServiceBookingInsert = Omit<BuildingServiceBooking, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type CartItemInsert = Omit<CartItem, "id" | "created_at"> & { id?: string; created_at?: string };
export type ChatConversationInsert = Omit<ChatConversation, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type ChatMessageInsert = Omit<ChatMessage, "id" | "created_at"> & { id?: string; created_at?: string };
export type CourseLessonInsert = Omit<CourseLesson, "id" | "created_at"> & { id?: string; created_at?: string };
export type CourseInsert = Omit<Course, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type DeliveryManagerInsert = Omit<DeliveryManager, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type DepartmentInsert = Omit<Department, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type DoctorInsert = Omit<Doctor, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type EnrollmentInsert = Omit<Enrollment, "id" | "created_at"> & { id?: string; created_at?: string };
export type ExpertAvailabilityInsert = Omit<ExpertAvailability, "id"> & { id?: string };
export type ExpertReviewInsert = Omit<ExpertReview, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type ExpertWishlistInsert = Omit<ExpertWishlist, "id" | "created_at"> & { id?: string; created_at?: string };
export type HealthTicketInsert = Omit<HealthTicket, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type LearnDirectMessageInsert = Omit<LearnDirectMessage, "id" | "created_at"> & { id?: string; created_at?: string };
export type LearnPostCommentInsert = Omit<LearnPostComment, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type LearnPostLikeInsert = Omit<LearnPostLike, "id" | "created_at"> & { id?: string; created_at?: string };
export type LearnPostInsert = Omit<LearnPost, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type MedicineOrderItemInsert = Omit<MedicineOrderItem, "id" | "created_at"> & { id?: string; created_at?: string };
export type MedicineOrderInsert = Omit<MedicineOrder, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type MedicineInsert = Omit<Medicine, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type NeedCategoryInsert = Omit<NeedCategory, "id" | "created_at"> & { id?: string; created_at?: string };
export type NeedItemInsert = Omit<NeedItem, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type NotificationInsert = Omit<Notification, "id" | "created_at"> & { id?: string; created_at?: string };
export type OrderTrackingInsert = Omit<OrderTracking, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type ProductReviewInsert = Omit<ProductReview, "id" | "created_at"> & { id?: string; created_at?: string };
export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
export type ServiceWorkerInsert = Omit<ServiceWorker, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type TicketMessageInsert = Omit<TicketMessage, "id" | "created_at"> & { id?: string; created_at?: string };
export type TicketInsert = Omit<Ticket, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type UserCertificateInsert = Omit<UserCertificate, "id"> & { id?: string };
export type UserRoleInsert = Omit<UserRole, "id" | "created_at"> & { id?: string; created_at?: string };
export type VendorOrderInsert = Omit<VendorOrder, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type VendorInsert = Omit<Vendor, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type VideoProgressInsert = Omit<VideoProgress, "id"> & { id?: string };
export type WishlistInsert = Omit<Wishlist, "id" | "created_at"> & { id?: string; created_at?: string };
export type PaymentInsert = Omit<Payment, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type RefundInsert = Omit<Refund, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type WalletInsert = Omit<Wallet, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
export type WalletTransactionInsert = Omit<WalletTransaction, "id" | "created_at"> & { id?: string; created_at?: string };

// ── Update types (partial models) ──────────────────────────────────

export type AuditLogUpdate = Partial<Omit<AuditLog, "id">>;
export type BookingUpdate = Partial<Omit<Booking, "id">>;
export type BuildingServiceBookingUpdate = Partial<Omit<BuildingServiceBooking, "id">>;
export type CartItemUpdate = Partial<Omit<CartItem, "id">>;
export type ChatConversationUpdate = Partial<Omit<ChatConversation, "id">>;
export type ChatMessageUpdate = Partial<Omit<ChatMessage, "id">>;
export type CourseLessonUpdate = Partial<Omit<CourseLesson, "id">>;
export type CourseUpdate = Partial<Omit<Course, "id">>;
export type DeliveryManagerUpdate = Partial<Omit<DeliveryManager, "id">>;
export type DepartmentUpdate = Partial<Omit<Department, "id">>;
export type DoctorUpdate = Partial<Omit<Doctor, "id">>;
export type EnrollmentUpdate = Partial<Omit<Enrollment, "id">>;
export type ExpertAvailabilityUpdate = Partial<Omit<ExpertAvailability, "id">>;
export type ExpertReviewUpdate = Partial<Omit<ExpertReview, "id">>;
export type ExpertWishlistUpdate = Partial<Omit<ExpertWishlist, "id">>;
export type HealthTicketUpdate = Partial<Omit<HealthTicket, "id">>;
export type LearnDirectMessageUpdate = Partial<Omit<LearnDirectMessage, "id">>;
export type LearnPostCommentUpdate = Partial<Omit<LearnPostComment, "id">>;
export type LearnPostLikeUpdate = Partial<Omit<LearnPostLike, "id">>;
export type LearnPostUpdate = Partial<Omit<LearnPost, "id">>;
export type MedicineOrderItemUpdate = Partial<Omit<MedicineOrderItem, "id">>;
export type MedicineOrderUpdate = Partial<Omit<MedicineOrder, "id">>;
export type MedicineUpdate = Partial<Omit<Medicine, "id">>;
export type NeedCategoryUpdate = Partial<Omit<NeedCategory, "id">>;
export type NeedItemUpdate = Partial<Omit<NeedItem, "id">>;
export type NotificationUpdate = Partial<Omit<Notification, "id">>;
export type OrderTrackingUpdate = Partial<Omit<OrderTracking, "id">>;
export type ProductReviewUpdate = Partial<Omit<ProductReview, "id">>;
export type ProductUpdate = Partial<Omit<Product, "id">>;
export type ProfileUpdate = Partial<Omit<Profile, "id">>;
export type ServiceWorkerUpdate = Partial<Omit<ServiceWorker, "id">>;
export type TicketMessageUpdate = Partial<Omit<TicketMessage, "id">>;
export type TicketUpdate = Partial<Omit<Ticket, "id">>;
export type UserCertificateUpdate = Partial<Omit<UserCertificate, "id">>;
export type UserRoleUpdate = Partial<Omit<UserRole, "id">>;
export type VendorOrderUpdate = Partial<Omit<VendorOrder, "id">>;
export type VendorUpdate = Partial<Omit<Vendor, "id">>;
export type VideoProgressUpdate = Partial<Omit<VideoProgress, "id">>;
export type WishlistUpdate = Partial<Omit<Wishlist, "id">>;
export type PaymentUpdate = Partial<Omit<Payment, "id">>;
export type RefundUpdate = Partial<Omit<Refund, "id">>;
export type WalletUpdate = Partial<Omit<Wallet, "id">>;
export type WalletTransactionUpdate = Partial<Omit<WalletTransaction, "id">>;

// ── Table map (for generic type lookups) ───────────────────────────
//
// Mirrors the PostgreSQL tables exposed through the Laravel REST
// gateway (`/api/db/{table}`).

export interface DatabaseSchema {
  audit_logs: { Row: AuditLog; Insert: AuditLogInsert; Update: AuditLogUpdate };
  bookings: { Row: Booking; Insert: BookingInsert; Update: BookingUpdate };
  building_service_bookings: { Row: BuildingServiceBooking; Insert: BuildingServiceBookingInsert; Update: BuildingServiceBookingUpdate };
  cart_items: { Row: CartItem; Insert: CartItemInsert; Update: CartItemUpdate };
  chat_conversations: { Row: ChatConversation; Insert: ChatConversationInsert; Update: ChatConversationUpdate };
  chat_messages: { Row: ChatMessage; Insert: ChatMessageInsert; Update: ChatMessageUpdate };
  course_lessons: { Row: CourseLesson; Insert: CourseLessonInsert; Update: CourseLessonUpdate };
  courses: { Row: Course; Insert: CourseInsert; Update: CourseUpdate };
  delivery_managers: { Row: DeliveryManager; Insert: DeliveryManagerInsert; Update: DeliveryManagerUpdate };
  departments: { Row: Department; Insert: DepartmentInsert; Update: DepartmentUpdate };
  doctors: { Row: Doctor; Insert: DoctorInsert; Update: DoctorUpdate };
  enrollments: { Row: Enrollment; Insert: EnrollmentInsert; Update: EnrollmentUpdate };
  expert_availability: { Row: ExpertAvailability; Insert: ExpertAvailabilityInsert; Update: ExpertAvailabilityUpdate };
  expert_reviews: { Row: ExpertReview; Insert: ExpertReviewInsert; Update: ExpertReviewUpdate };
  expert_wishlists: { Row: ExpertWishlist; Insert: ExpertWishlistInsert; Update: ExpertWishlistUpdate };
  health_tickets: { Row: HealthTicket; Insert: HealthTicketInsert; Update: HealthTicketUpdate };
  learn_direct_messages: { Row: LearnDirectMessage; Insert: LearnDirectMessageInsert; Update: LearnDirectMessageUpdate };
  learn_post_comments: { Row: LearnPostComment; Insert: LearnPostCommentInsert; Update: LearnPostCommentUpdate };
  learn_post_likes: { Row: LearnPostLike; Insert: LearnPostLikeInsert; Update: LearnPostLikeUpdate };
  learn_posts: { Row: LearnPost; Insert: LearnPostInsert; Update: LearnPostUpdate };
  medicine_order_items: { Row: MedicineOrderItem; Insert: MedicineOrderItemInsert; Update: MedicineOrderItemUpdate };
  medicine_orders: { Row: MedicineOrder; Insert: MedicineOrderInsert; Update: MedicineOrderUpdate };
  medicines: { Row: Medicine; Insert: MedicineInsert; Update: MedicineUpdate };
  need_categories: { Row: NeedCategory; Insert: NeedCategoryInsert; Update: NeedCategoryUpdate };
  need_items: { Row: NeedItem; Insert: NeedItemInsert; Update: NeedItemUpdate };
  notifications: { Row: Notification; Insert: NotificationInsert; Update: NotificationUpdate };
  order_tracking: { Row: OrderTracking; Insert: OrderTrackingInsert; Update: OrderTrackingUpdate };
  product_reviews: { Row: ProductReview; Insert: ProductReviewInsert; Update: ProductReviewUpdate };
  products: { Row: Product; Insert: ProductInsert; Update: ProductUpdate };
  profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate };
  service_workers: { Row: ServiceWorker; Insert: ServiceWorkerInsert; Update: ServiceWorkerUpdate };
  ticket_messages: { Row: TicketMessage; Insert: TicketMessageInsert; Update: TicketMessageUpdate };
  tickets: { Row: Ticket; Insert: TicketInsert; Update: TicketUpdate };
  user_certificates: { Row: UserCertificate; Insert: UserCertificateInsert; Update: UserCertificateUpdate };
  user_roles: { Row: UserRole; Insert: UserRoleInsert; Update: UserRoleUpdate };
  vendor_orders: { Row: VendorOrder; Insert: VendorOrderInsert; Update: VendorOrderUpdate };
  vendors: { Row: Vendor; Insert: VendorInsert; Update: VendorUpdate };
  video_progress: { Row: VideoProgress; Insert: VideoProgressInsert; Update: VideoProgressUpdate };
  wishlists: { Row: Wishlist; Insert: WishlistInsert; Update: WishlistUpdate };
  payments: { Row: Payment; Insert: PaymentInsert; Update: PaymentUpdate };
  refunds: { Row: Refund; Insert: RefundInsert; Update: RefundUpdate };
  wallets: { Row: Wallet; Insert: WalletInsert; Update: WalletUpdate };
  wallet_transactions: { Row: WalletTransaction; Insert: WalletTransactionInsert; Update: WalletTransactionUpdate };
}

export type TableName = keyof DatabaseSchema;
export type TableRow<T extends TableName> = DatabaseSchema[T]["Row"];
export type TableInsert<T extends TableName> = DatabaseSchema[T]["Insert"];
export type TableUpdate<T extends TableName> = DatabaseSchema[T]["Update"];

// ── Auth types ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface Session {
  user: User;
  accessToken: string;
}

// ── RPC function types ─────────────────────────────────────────────

export interface RPCFunctions {
  get_user_role: { args: { _user_id: string }; returns: AppRole };
  has_role: { args: { _role: AppRole; _user_id: string }; returns: boolean };
}
