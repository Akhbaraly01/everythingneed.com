import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagingApi } from "../api";
import type { CreateConversationInput, SendMessageInput } from "../validators";

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["messaging", "conversations", id],
    queryFn: () => messagingApi.getConversation(id),
    enabled: !!id,
  });
}

export function useCustomerConversations(customerId: string) {
  return useQuery({
    queryKey: ["messaging", "conversations", "customer", customerId],
    queryFn: () => messagingApi.getCustomerConversations(customerId),
    enabled: !!customerId,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messaging", "messages", conversationId],
    queryFn: () => messagingApi.getMessages(conversationId),
    enabled: !!conversationId,
  });
}

export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: ["messaging", "unread", userId],
    queryFn: () => messagingApi.getUnreadCount(userId),
    enabled: !!userId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConversationInput) => messagingApi.createConversation(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messaging"] }),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageInput) => messagingApi.sendMessage(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messaging"] }),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      messagingApi.markAsRead(conversationId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messaging"] }),
  });
}
