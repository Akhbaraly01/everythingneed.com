import { http } from "@core/api";
import { qs } from "@core/api";
import type { CreateTicketInput, AddTicketMessageInput, AssignTicketInput, ResolveTicketInput } from "../validators";

const API_BASE = "/api/tickets";

export const ticketsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByNumber: (ticketNumber: string) => http.get<any>(`${API_BASE}/number/${ticketNumber}`),
  getUserTickets: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}${qs(params)}`),
  getAssignedTickets: (assigneeId: string, params?: any) => http.get<any[]>(`${API_BASE}/assigned/${assigneeId}${qs(params)}`),
  getMessages: (ticketId: string, params?: any) => http.get<any[]>(`${API_BASE}/${ticketId}/messages${qs(params)}`),
  getDepartments: () => http.get<any[]>(`${API_BASE}/departments`),
  create: (data: CreateTicketInput) => http.post<any>(API_BASE, data),
  addMessage: (data: AddTicketMessageInput) => http.post<any>(`${API_BASE}/${data.ticketId}/messages`, data),
  assign: (data: AssignTicketInput) => http.post<void>(`${API_BASE}/${data.ticketId}/assign`, { assigneeId: data.assigneeId }),
  updateStatus: (id: string, status: string) => http.post<void>(`${API_BASE}/${id}/status`, { status }),
  resolve: (data: ResolveTicketInput) => http.post<void>(`${API_BASE}/${data.ticketId}/resolve`, { resolution: data.resolution }),
  close: (id: string) => http.post<void>(`${API_BASE}/${id}/close`),
};
