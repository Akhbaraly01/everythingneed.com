import { http, qs } from "@core/api";
import type { CreateConversationInput, SendMessageInput, AssignWorkerInput } from "../validators";

const API_BASE = "/api/messaging";

export const messagingApi = {
  getConversation: (id: string) => http.get<any>(`${API_BASE}/conversations/${id}`),
  getCustomerConversations: (customerId: string) => http.get<any[]>(`${API_BASE}/conversations/customer/${customerId}`),
  getWorkerConversations: (workerId: string) => http.get<any[]>(`${API_BASE}/conversations/worker/${workerId}`),
  getMessages: (conversationId: string, params?: any) => http.get<any[]>(`${API_BASE}/conversations/${conversationId}/messages${qs(params)}`),
  getUnreadCount: (userId: string) => http.get<number>(`${API_BASE}/unread/${userId}`),
  createConversation: (data: CreateConversationInput) => http.post<any>(`${API_BASE}/conversations`, data),
  sendMessage: (data: SendMessageInput) => http.post<any>(`${API_BASE}/messages`, data),
  markAsRead: (conversationId: string, userId: string) => http.post<void>(`${API_BASE}/conversations/${conversationId}/read`, { userId }),
  assignWorker: (data: AssignWorkerInput) => http.post<void>(`${API_BASE}/conversations/${data.conversationId}/assign`, { workerId: data.workerId }),
};
