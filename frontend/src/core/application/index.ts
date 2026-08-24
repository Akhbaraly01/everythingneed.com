/**
 * Application Layer - Use cases, DTOs, Commands, Queries, Ports.
 * Orchestrates domain logic and infrastructure.
 *
 * Laravel mapping: app/Application/*
 */

import type {
  QueryParams,
  PaginatedResult,
  Command,
  CommandHandler,
  Query,
  QueryHandler,
  DomainEvent,
} from "@core/domain";

// ── DTOs (Data Transfer Objects) ─────────────────────────────────

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface UpdateUserDTO {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CreateProductDTO {
  vendorId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  comparePrice?: number;
  imageUrl?: string;
  images?: string[];
  stockQuantity: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  comparePrice?: number;
  imageUrl?: string;
  images?: string[];
  stockQuantity?: number;
  isActive?: boolean;
}

export interface CreateMedicineDTO {
  name: string;
  genericName?: string;
  category: string;
  description?: string;
  price: number;
  imageUrl?: string;
  requiresPrescription: boolean;
  stockQuantity: number;
}

export interface CreateDoctorDTO {
  userId?: string;
  fullName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  virtualFee?: number;
  avatarUrl?: string;
}

export interface CreateHealthTicketDTO {
  patientId: string;
  symptoms: string;
  description?: string;
  consultationType?: string;
  consultationFee?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  isRandomAssignment?: boolean;
}

export interface CreateBookingDTO {
  userId: string;
  serviceType: string;
  serviceId?: string;
  details: Record<string, unknown>;
}

export interface CreateMedicineOrderDTO {
  userId: string;
  deliveryAddress: string;
  prescriptionUrl?: string;
  items: Array<{
    medicineId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CreateVendorOrderDTO {
  vendorId: string;
  customerId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  shippingAddress?: string;
  notes?: string;
}

export interface CreateTicketDTO {
  userId: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  departmentId?: string;
}

export interface CreateLearnPostDTO {
  userId: string;
  title: string;
  content: string;
  category: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationMinutes?: number;
}

export interface SendMessageDTO {
  conversationId: string;
  senderId: string;
  body: string;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateUserCommand extends Command<CreateUserDTO> {
  type: "CreateUser";
}

export interface UpdateUserCommand extends Command<{ userId: string; data: UpdateUserDTO }> {
  type: "UpdateUser";
}

export interface DeleteUserCommand extends Command<{ userId: string }> {
  type: "DeleteUser";
}

export interface CreateProductCommand extends Command<CreateProductDTO> {
  type: "CreateProduct";
}

export interface UpdateProductCommand extends Command<{ productId: string; data: UpdateProductDTO }> {
  type: "UpdateProduct";
}

export interface DeleteProductCommand extends Command<{ productId: string }> {
  type: "DeleteProduct";
}

export interface CreateMedicineCommand extends Command<CreateMedicineDTO> {
  type: "CreateMedicine";
}

export interface CreateDoctorCommand extends Command<CreateDoctorDTO> {
  type: "CreateDoctor";
}

export interface BookAppointmentCommand extends Command<CreateHealthTicketDTO> {
  type: "BookAppointment";
}

export interface CreateOrderCommand extends Command<CreateMedicineOrderDTO> {
  type: "CreateOrder";
}

export interface CreateVendorOrderCommand extends Command<CreateVendorOrderDTO> {
  type: "CreateVendorOrder";
}

export interface CreateSupportTicketCommand extends Command<CreateTicketDTO> {
  type: "CreateSupportTicket";
}

export interface CreatePostCommand extends Command<CreateLearnPostDTO> {
  type: "CreatePost";
}

export interface AddToCartCommand extends Command<{
  userId: string;
  medicineId: string;
  quantity: number;
}> {
  type: "AddToCart";
}

export interface RemoveFromCartCommand extends Command<{
  userId: string;
  cartItemId: string;
}> {
  type: "RemoveFromCart";
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetUserQuery extends Query<{ userId: string }, any> {
  type: "GetUser";
}

export interface GetUserByEmailQuery extends Query<{ email: string }, any> {
  type: "GetUserByEmail";
}

export interface GetProductsQuery extends Query<QueryParams, PaginatedResult<any>> {
  type: "GetProducts";
}

export interface GetProductQuery extends Query<{ productId: string }, any> {
  type: "GetProduct";
}

export interface GetMedicinesQuery extends Query<QueryParams, PaginatedResult<any>> {
  type: "GetMedicines";
}

export interface GetDoctorsQuery extends Query<QueryParams, PaginatedResult<any>> {
  type: "GetDoctors";
}

export interface GetHealthTicketsQuery extends Query<{ patientId: string; params?: QueryParams }, PaginatedResult<any>> {
  type: "GetHealthTickets";
}

export interface GetUserOrdersQuery extends Query<{ userId: string; params?: QueryParams }, PaginatedResult<any>> {
  type: "GetUserOrders";
}

export interface GetUserCartQuery extends Query<{ userId: string }, any[]> {
  type: "GetUserCart";
}

export interface GetUserNotificationsQuery extends Query<{ userId: string; params?: QueryParams }, PaginatedResult<any>> {
  type: "GetUserNotifications";
}

export interface GetSupportTicketsQuery extends Query<{ userId: string; params?: QueryParams }, PaginatedResult<any>> {
  type: "GetSupportTickets";
}

export interface GetLearnPostsQuery extends Query<QueryParams, PaginatedResult<any>> {
  type: "GetLearnPosts";
}

// ── Ports (Interfaces for Infrastructure) ────────────────────────

export interface PaymentPort {
  charge(input: {
    amount: number;
    currency: string;
    reference: string;
    userId: string;
  }): Promise<{ paymentId: string; status: "succeeded" | "failed" | "pending" }>;

  refund(input: { paymentId: string; amount?: number }): Promise<{ refundId: string }>;
}

export interface NotificationPort {
  send(input: {
    userId: string;
    channel: "email" | "push" | "in_app" | "sms";
    template: string;
    data: Record<string, unknown>;
  }): Promise<void>;
}

export interface MessagingPort {
  sendMessage(input: {
    conversationId: string;
    senderId: string;
    body: string;
  }): Promise<{ messageId: string }>;
}

export interface SearchPort<T = unknown> {
  query(input: {
    q: string;
    filters?: Record<string, unknown>;
    page?: number;
    perPage?: number;
  }): Promise<{ items: T[]; total: number }>;
}

export interface StoragePort {
  upload(path: string, file: File | Blob, options?: { contentType?: string }): Promise<{ url: string }>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

export interface AnalyticsPort {
  track(event: string, payload?: Record<string, unknown>): void;
}

export interface AuditPort {
  log(input: {
    actorId: string;
    action: string;
    subjectType: string;
    subjectId: string;
    meta?: Record<string, unknown>;
  }): Promise<void>;
}

export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}

export interface MapsPort {
  geocode(address: string): Promise<{ lat: number; lng: number }>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
  getDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number }>;
}

export interface AiPort {
  analyzeSymptoms(symptoms: string): Promise<{ severity: string; recommendations: string[] }>;
  generateContent(prompt: string): Promise<string>;
  classifyText(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
}

// ── Event Emitter Port ───────────────────────────────────────────

export interface EventPort {
  emit(event: string, payload: unknown): void;
  on(event: string, handler: (payload: unknown) => void | Promise<void>): () => void;
}

// ── Unit of Work Port ────────────────────────────────────────────

export interface UnitOfWorkPort {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getTransactionId(): string;
}

// ── Repository Factory Port ──────────────────────────────────────

export interface RepositoryFactoryPort {
  getProfileRepository(): any;
  getUserRoleRepository(): any;
  getProductRepository(): any;
  getMedicineRepository(): any;
  getDoctorRepository(): any;
  getHealthTicketRepository(): any;
  getCartRepository(): any;
  getBookingRepository(): any;
  getMedicineOrderRepository(): any;
  getVendorOrderRepository(): any;
  getTicketRepository(): any;
  getNotificationRepository(): any;
  getLearnPostRepository(): any;
  getChatConversationRepository(): any;
  getChatMessageRepository(): any;
}
