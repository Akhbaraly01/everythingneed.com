/**
 * Deliveries Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Deliveries/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface ShipmentId {
  value: string;
}

export interface TrackingId {
  value: string;
}

export interface ShipmentStatus {
  value: "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  orderId: string;
  userId: string;
  carrierId?: string;
  trackingNumber?: string;
  status: string;
  shippingMethod?: string;
  shippingCost?: number;
  currency: string;
  originAddress?: ShippingAddress;
  destinationAddress: ShippingAddress;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  weight?: number;
  dimensions?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tracking {
  id: string;
  shipmentId: string;
  status: string;
  location?: string;
  description?: string;
  carrier?: string;
  timestamp: Date;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states?: string[];
  postalCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingRate {
  id: string;
  zoneId: string;
  method: string;
  baseRate: number;
  perKgRate?: number;
  freeShippingThreshold?: number;
  estimatedDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ShipmentCreatedEvent {
  type: "ShipmentCreated";
  shipmentId: string;
  orderId: string;
  userId: string;
  timestamp: Date;
}

export interface TrackingUpdatedEvent {
  type: "TrackingUpdated";
  shipmentId: string;
  trackingId: string;
  status: string;
  location?: string;
  timestamp: Date;
}

export interface ShipmentDeliveredEvent {
  type: "ShipmentDelivered";
  shipmentId: string;
  orderId: string;
  deliveredAt: Date;
  timestamp: Date;
}

export interface ShipmentFailedEvent {
  type: "ShipmentFailed";
  shipmentId: string;
  reason?: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface DeliveryService {
  createShipment(data: {
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
  }): Promise<Shipment>;

  updateTracking(shipmentId: string, data: {
    status: string;
    location?: string;
    description?: string;
    carrier?: string;
  }): Promise<Tracking>;

  markDelivered(shipmentId: string, actualDelivery?: Date): Promise<void>;
  markFailed(shipmentId: string, reason?: string): Promise<void>;

  getShipmentById(shipmentId: string): Promise<Shipment | null>;
  getShipmentsByOrder(orderId: string): Promise<Shipment[]>;
  getShipmentsByUser(userId: string): Promise<Shipment[]>;
  getTrackingHistory(shipmentId: string): Promise<Tracking[]>;

  calculateShippingRate(zoneId: string, method: string, weight?: number, cartTotal?: number): Promise<number>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class ShipmentNotFoundError extends DomainError {
  constructor(shipmentId: string) {
    super(`Shipment ${shipmentId} not found`, "SHIPMENT_NOT_FOUND");
    this.name = "ShipmentNotFoundError";
  }
}

export class ShipmentAlreadyDeliveredError extends DomainError {
  constructor(shipmentId: string) {
    super(`Shipment ${shipmentId} is already delivered`, "SHIPMENT_ALREADY_DELIVERED");
    this.name = "ShipmentAlreadyDeliveredError";
  }
}

export class InvalidShipmentStatusError extends DomainError {
  constructor(shipmentId: string, currentStatus: string, attemptedStatus: string) {
    super(`Cannot transition shipment ${shipmentId} from ${currentStatus} to ${attemptedStatus}`, "INVALID_SHIPMENT_STATUS");
    this.name = "InvalidShipmentStatusError";
  }
}

export class ShippingZoneNotFoundError extends DomainError {
  constructor(zoneId: string) {
    super(`Shipping zone ${zoneId} not found`, "SHIPPING_ZONE_NOT_FOUND");
    this.name = "ShippingZoneNotFoundError";
  }
}

export class ShippingRateNotFoundError extends DomainError {
  constructor(zoneId: string, method: string) {
    super(`Shipping rate not found for zone ${zoneId} and method ${method}`, "SHIPPING_RATE_NOT_FOUND");
    this.name = "ShippingRateNotFoundError";
  }
}
