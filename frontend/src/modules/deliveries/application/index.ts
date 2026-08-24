/**
 * Deliveries Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Deliveries/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Shipment, Tracking, ShippingAddress } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateShipmentDTO {
  orderId: string;
  userId: string;
  carrierId?: string;
  shippingMethod?: string;
  shippingCost?: number;
  currency?: string;
  destinationAddress: ShippingAddress;
  estimatedDelivery?: Date;
  weight?: number;
  dimensions?: string;
  notes?: string;
}

export interface UpdateTrackingDTO {
  status: string;
  location?: string;
  description?: string;
  carrier?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateShipmentCommand {
  type: "CreateShipment";
  payload: CreateShipmentDTO;
}

export interface UpdateTrackingCommand {
  type: "UpdateTracking";
  payload: {
    shipmentId: string;
    data: UpdateTrackingDTO;
  };
}

export interface MarkDeliveredCommand {
  type: "MarkDelivered";
  payload: {
    shipmentId: string;
    actualDelivery?: Date;
  };
}

export interface MarkFailedCommand {
  type: "MarkFailed";
  payload: {
    shipmentId: string;
    reason?: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetShipmentQuery {
  type: "GetShipment";
  payload: { shipmentId: string };
}

export interface GetShipmentsByOrderQuery {
  type: "GetShipmentsByOrder";
  payload: { orderId: string };
}

export interface GetShipmentsByUserQuery {
  type: "GetShipmentsByUser";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetTrackingHistoryQuery {
  type: "GetTrackingHistory";
  payload: { shipmentId: string };
}

export interface CalculateShippingRateQuery {
  type: "CalculateShippingRate";
  payload: {
    zoneId: string;
    method: string;
    weight?: number;
    cartTotal?: number;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface DeliveryApplicationService {
  createShipment(command: CreateShipmentCommand): Promise<Shipment>;
  updateTracking(command: UpdateTrackingCommand): Promise<Tracking>;
  markDelivered(command: MarkDeliveredCommand): Promise<void>;
  markFailed(command: MarkFailedCommand): Promise<void>;

  getShipment(query: GetShipmentQuery): Promise<Shipment | null>;
  getShipmentsByOrder(query: GetShipmentsByOrderQuery): Promise<Shipment[]>;
  getShipmentsByUser(query: GetShipmentsByUserQuery): Promise<PaginatedResult<Shipment>>;
  getTrackingHistory(query: GetTrackingHistoryQuery): Promise<Tracking[]>;
  calculateShippingRate(query: CalculateShippingRateQuery): Promise<number>;
}
