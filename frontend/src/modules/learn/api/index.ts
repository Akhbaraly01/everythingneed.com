import { http, qs } from "@core/api";
import type { CreatePostInput, UpdatePostInput, SendDirectMessageInput } from "../validators";

const API_BASE = "/api/learn";

export const learnApi = {
  getPost: (id: string) => http.get<any>(`${API_BASE}/posts/${id}`),
  getUserPosts: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/posts/user/${userId}${qs(params)}`),
  getCategoryPosts: (category: string, params?: any) => http.get<any[]>(`${API_BASE}/posts/category/${category}${qs(params)}`),
  getFeaturedPosts: (params?: any) => http.get<any[]>(`${API_BASE}/posts/featured${qs(params)}`),
  search: (query: string, params?: any) => http.get<any[]>(`${API_BASE}/posts/search${qs({ q: query, ...params })}`),
  getComments: (postId: string, params?: any) => http.get<any[]>(`${API_BASE}/posts/${postId}/comments${qs(params)}`),
  getDirectMessages: (userId: string, otherUserId: string) =>
    http.get<any[]>(`${API_BASE}/messages/${userId}/${otherUserId}`),
  createPost: (data: CreatePostInput) => http.post<any>(`${API_BASE}/posts`, data),
  updatePost: (id: string, data: UpdatePostInput) => http.put<any>(`${API_BASE}/posts/${id}`, data),
  deletePost: (id: string) => http.delete<void>(`${API_BASE}/posts/${id}`),
  likePost: (postId: string, userId: string) => http.post<void>(`${API_BASE}/posts/${postId}/like`, { userId }),
  unlikePost: (postId: string, userId: string) => http.post<void>(`${API_BASE}/posts/${postId}/unlike`, { userId }),
  addComment: (postId: string, userId: string, content: string) =>
    http.post<any>(`${API_BASE}/posts/${postId}/comments`, { userId, content }),
  sendDirectMessage: (data: SendDirectMessageInput) => http.post<any>(`${API_BASE}/messages`, data),
};
