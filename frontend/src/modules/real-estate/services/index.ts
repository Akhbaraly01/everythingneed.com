import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { RealEstateService } from "../domain";

export const realEstateService: RealEstateService = {
  async createListing(data) {
    const result: any = await http.post("/api/properties", data);
    const listing = result.data;
    eventBus.emit("ListingCreated", { listingId: listing?.id, timestamp: new Date() });
    return listing;
  },

  async scheduleViewing(data) {
    const result: any = await http.post("/api/bookings", { ...data, service_type: 'property_viewing' });
    eventBus.emit("ViewingScheduled", { viewingRequestId: result.data?.id, timestamp: new Date() });
    return result.data;
  },

  async cancelViewing(viewingRequestId, reason) {
    await http.post(`/api/bookings/${viewingRequestId}/cancel`, { reason });
  },

  async confirmViewing(viewingRequestId, confirmedDate, confirmedTime) {
    const result: any = await http.post(`/api/bookings/${viewingRequestId}/confirm`, { date: confirmedDate, time: confirmedTime });
    return result.data;
  },

  async completeViewing(viewingRequestId) {
    await http.post(`/api/bookings/${viewingRequestId}/complete`);
    eventBus.emit("ViewingCompleted", { viewingRequestId, timestamp: new Date() });
  },

  async getPropertyById(propertyId) {
    const data: any = await http.get(`/api/properties/${propertyId}`);
    return data.data || null;
  },

  async getListingById(listingId) {
    const data: any = await http.get(`/api/properties/${listingId}`);
    return data.data || null;
  },

  async getListingsByProperty(propertyId) {
    const data: any = await http.get("/api/properties", { params: { property_id: propertyId } } as any);
    return data.data || [];
  },

  async getActiveListings(params) {
    const data: any = await http.get("/api/properties", { params: { status: "active", ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getViewingRequestsByUser(userId, params) {
    const data: any = await http.get("/api/bookings", { params: { user_id: userId, service_type: 'property_viewing', ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getViewingRequestsByListing(listingId, params) {
    const data: any = await http.get("/api/bookings", { params: { listing_id: listingId, service_type: 'property_viewing', ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },
};
