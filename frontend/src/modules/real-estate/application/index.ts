/**
 * Real Estate Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/RealEstate/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Property, Listing, ViewingRequest } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateListingDTO {
  propertyId: string;
  agentId?: string;
  listingType: string;
  price: number;
  rentAmount?: number;
  rentPeriod?: string;
  deposit?: number;
  availableFrom?: string;
  description?: string;
}

export interface ScheduleViewingDTO {
  listingId: string;
  userId: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateListingCommand {
  type: "CreateListing";
  payload: CreateListingDTO;
}

export interface UpdateListingCommand {
  type: "UpdateListing";
  payload: {
    listingId: string;
    data: Partial<CreateListingDTO>;
  };
}

export interface WithdrawListingCommand {
  type: "WithdrawListing";
  payload: { listingId: string };
}

export interface ScheduleViewingCommand {
  type: "ScheduleViewing";
  payload: ScheduleViewingDTO;
}

export interface ConfirmViewingCommand {
  type: "ConfirmViewing";
  payload: {
    viewingRequestId: string;
    confirmedDate: string;
    confirmedTime: string;
  };
}

export interface CancelViewingCommand {
  type: "CancelViewing";
  payload: {
    viewingRequestId: string;
    reason?: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetPropertyQuery {
  type: "GetProperty";
  payload: { propertyId: string };
}

export interface GetListingsQuery {
  type: "GetListings";
  payload: {
    params?: QueryParams;
  };
}

export interface GetListingsByPropertyQuery {
  type: "GetListingsByProperty";
  payload: { propertyId: string };
}

export interface GetViewingRequestsQuery {
  type: "GetViewingRequests";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetViewingRequestsByListingQuery {
  type: "GetViewingRequestsByListing";
  payload: {
    listingId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface RealEstateApplicationService {
  createListing(command: CreateListingCommand): Promise<Listing>;
  updateListing(command: UpdateListingCommand): Promise<Listing>;
  withdrawListing(command: WithdrawListingCommand): Promise<void>;
  scheduleViewing(command: ScheduleViewingCommand): Promise<ViewingRequest>;
  confirmViewing(command: ConfirmViewingCommand): Promise<ViewingRequest>;
  cancelViewing(command: CancelViewingCommand): Promise<void>;

  getProperty(query: GetPropertyQuery): Promise<Property | null>;
  getListings(query: GetListingsQuery): Promise<PaginatedResult<Listing>>;
  getListingsByProperty(query: GetListingsByPropertyQuery): Promise<Listing[]>;
  getViewingRequests(query: GetViewingRequestsQuery): Promise<PaginatedResult<ViewingRequest>>;
  getViewingRequestsByListing(query: GetViewingRequestsByListingQuery): Promise<PaginatedResult<ViewingRequest>>;
}
