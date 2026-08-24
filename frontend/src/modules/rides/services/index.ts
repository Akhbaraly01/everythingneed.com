import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { RideService } from "../domain";

export const rideService: RideService = {
  async requestRide(data) {
    const result: any = await http.post("/api/rides/request", data);
    const ride = result.data;
    eventBus.emit("RideRequested", { rideId: ride?.id, riderId: data.riderId, rideType: data.rideType, pickupLocation: data.pickupLocation, dropoffLocation: data.dropoffLocation, timestamp: new Date() });
    return ride;
  },

  async acceptRide(rideId, driverId) {
    const result: any = await http.post(`/api/rides/${rideId}/accept`, { driver_id: driverId });
    eventBus.emit("RideAccepted", { rideId, driverId, timestamp: new Date() });
    return result.data;
  },

  async startRide(rideId) {
    const result: any = await http.post(`/api/rides/${rideId}/start`);
    eventBus.emit("RideStarted", { rideId, driverId: "", timestamp: new Date() });
    return result.data;
  },

  async completeRide(rideId, data) {
    const result: any = await http.post(`/api/rides/${rideId}/complete`, data);
    eventBus.emit("RideCompleted", { rideId, driverId: "", riderId: "", fare: data?.fare || 0, rating: data?.rating, timestamp: new Date() });
    return result.data;
  },

  async cancelRide(rideId, cancelledBy, reason) {
    const result: any = await http.post(`/api/rides/${rideId}/cancel`, { cancelled_by: cancelledBy, reason });
    eventBus.emit("RideCancelled", { rideId, cancelledBy, reason, timestamp: new Date() });
    return result.data;
  },

  async getRideById(rideId) {
    const data: any = await http.get(`/api/rides/${rideId}`);
    return data.data || null;
  },

  async getRiderRides(riderId, params) {
    const data: any = await http.get("/api/my-rides", { params: { rider_id: riderId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getDriverRides(driverId, params) {
    const data: any = await http.get("/api/my-rides", { params: { driver_id: driverId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getDriverById(driverId) {
    const data: any = await http.get(`/api/rides/drivers/${driverId}`);
    return data.data || null;
  },

  async getAvailableDrivers(latitude, longitude) {
    const data: any = await http.get("/api/rides/drivers/available", { params: { latitude, longitude } } as any);
    return data.data || [];
  },
};
