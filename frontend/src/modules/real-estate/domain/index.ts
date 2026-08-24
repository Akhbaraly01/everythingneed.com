/**
 * Real Estate Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/RealEstate/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, Address } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface PropertyId {
  value: string;
}

export interface ListingId {
  value: string;
}

export interface ViewingRequestId {
  value: string;
}

export interface PropertyType {
  value: "apartment" | "house" | "condo" | "land" | "commercial" | "townhouse";
}

export interface ListingType {
  value: "sale" | "rent" | "lease";
}

export interface ListingStatus {
  value: "active" | "pending" | "sold" | "rented" | "expired" | "withdrawn";
}

export interface ViewingStatus {
  value: "pending" | "confirmed" | "completed" | "cancelled";
}

export interface PropertyFeature {
  name: string;
  value?: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  propertyType: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  yearBuilt?: number;
  imageUrl?: string;
  images?: string[];
  features?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  propertyId: string;
  agentId?: string;
  listingType: string;
  price: number;
  rentAmount?: number;
  rentPeriod?: string;
  deposit?: number;
  status: string;
  availableFrom?: string;
  description?: string;
  viewsCount: number;
  inquiriesCount: number;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewingRequest {
  id: string;
  listingId: string;
  propertyId: string;
  userId: string;
  agentId?: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: string;
  confirmedDate?: string;
  confirmedTime?: string;
  notes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ListingCreatedEvent {
  type: "ListingCreated";
  listingId: string;
  propertyId: string;
  agentId?: string;
  listingType: string;
  price: number;
  timestamp: Date;
}

export interface ListingStatusChangedEvent {
  type: "ListingStatusChanged";
  listingId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface ViewingScheduledEvent {
  type: "ViewingScheduled";
  viewingRequestId: string;
  listingId: string;
  userId: string;
  agentId?: string;
  date: string;
  time: string;
  timestamp: Date;
}

export interface ViewingCompletedEvent {
  type: "ViewingCompleted";
  viewingRequestId: string;
  listingId: string;
  userId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface RealEstateService {
  createListing(data: {
    propertyId: string;
    agentId?: string;
    listingType: string;
    price: number;
    rentAmount?: number;
    rentPeriod?: string;
    deposit?: number;
    availableFrom?: string;
    description?: string;
  }): Promise<Listing>;

  scheduleViewing(data: {
    listingId: string;
    userId: string;
    preferredDate: string;
    preferredTime: string;
    message?: string;
  }): Promise<ViewingRequest>;

  cancelViewing(viewingRequestId: string, reason?: string): Promise<void>;
  confirmViewing(viewingRequestId: string, confirmedDate: string, confirmedTime: string): Promise<void>;
  completeViewing(viewingRequestId: string): Promise<void>;

  getPropertyById(propertyId: string): Promise<Property | null>;
  getListingById(listingId: string): Promise<Listing | null>;
  getListingsByProperty(propertyId: string): Promise<Listing[]>;
  getActiveListings(params?: any): Promise<{ items: Listing[]; total: number }>;
  getViewingRequestsByUser(userId: string, params?: any): Promise<{ items: ViewingRequest[]; total: number }>;
  getViewingRequestsByListing(listingId: string, params?: any): Promise<{ items: ViewingRequest[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class PropertyNotFoundError extends DomainError {
  constructor(propertyId: string) {
    super(`Property ${propertyId} not found`, "PROPERTY_NOT_FOUND");
    this.name = "PropertyNotFoundError";
  }
}

export class ListingNotFoundError extends DomainError {
  constructor(listingId: string) {
    super(`Listing ${listingId} not found`, "LISTING_NOT_FOUND");
    this.name = "ListingNotFoundError";
  }
}

export class ViewingRequestNotFoundError extends DomainError {
  constructor(viewingId: string) {
    super(`Viewing request ${viewingId} not found`, "VIEWING_REQUEST_NOT_FOUND");
    this.name = "ViewingRequestNotFoundError";
  }
}

export class ListingNotActiveError extends DomainError {
  constructor(listingId: string) {
    super(`Listing ${listingId} is not active`, "LISTING_NOT_ACTIVE");
    this.name = "ListingNotActiveError";
  }
}
