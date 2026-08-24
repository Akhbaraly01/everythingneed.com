import { http } from "@core/api";
import { qs } from "@core/api";
import type { CreateListingInput, ScheduleViewingInput } from "../validators";

const API_BASE = "/api/real-estate";

export const realEstateApi = {
  getProperty: (id: string) => http.get<any>(`${API_BASE}/properties/${id}`),
  getListing: (id: string) => http.get<any>(`${API_BASE}/listings/${id}`),
  getActiveListings: (params?: any) => http.get<any[]>(`${API_BASE}/listings${qs(params)}`),
  getListingsByProperty: (propertyId: string) => http.get<any[]>(`${API_BASE}/properties/${propertyId}/listings`),
  createListing: (data: CreateListingInput) => http.post<any>(`${API_BASE}/listings`, data),
  updateListing: (id: string, data: any) => http.put<any>(`${API_BASE}/listings/${id}`, data),
  withdrawListing: (id: string) => http.post<void>(`${API_BASE}/listings/${id}/withdraw`),
  scheduleViewing: (data: ScheduleViewingInput) => http.post<any>(`${API_BASE}/viewings`, data),
  confirmViewing: (id: string, date: string, time: string) => http.post<void>(`${API_BASE}/viewings/${id}/confirm`, { date, time }),
  cancelViewing: (id: string, reason?: string) => http.post<void>(`${API_BASE}/viewings/${id}/cancel`, { reason }),
  getViewingRequests: (userId: string) => http.get<any[]>(`${API_BASE}/viewings/user/${userId}`),
  getViewingRequestsByListing: (listingId: string) => http.get<any[]>(`${API_BASE}/listings/${listingId}/viewings`),
};
