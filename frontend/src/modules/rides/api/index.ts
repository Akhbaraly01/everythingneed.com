import { http, qs } from "@core/api";
import type { RequestRideInput, AcceptRideInput, CompleteRideInput, CancelRideInput } from "../validators";

const API_BASE = "/api/rides";

export const ridesApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getRiderRides: (riderId: string, params?: any) => http.get<any[]>(`${API_BASE}/rider/${riderId}${qs(params)}`),
  getDriverRides: (driverId: string, params?: any) => http.get<any[]>(`${API_BASE}/driver/${driverId}${qs(params)}`),
  getAvailableDrivers: (lat?: number, lng?: number) => http.get<any[]>(`${API_BASE}/drivers/available${qs({ latitude: lat, longitude: lng })}`),
  getDriver: (driverId: string) => http.get<any>(`${API_BASE}/drivers/${driverId}`),
  requestRide: (data: RequestRideInput) => http.post<any>(API_BASE, data),
  acceptRide: (data: AcceptRideInput) => http.post<any>(`${API_BASE}/accept`, data),
  startRide: (rideId: string) => http.post<void>(`${API_BASE}/${rideId}/start`),
  completeRide: (data: CompleteRideInput) => http.post<any>(`${API_BASE}/complete`, data),
  cancelRide: (data: CancelRideInput) => http.post<any>(`${API_BASE}/cancel`, data),
};
