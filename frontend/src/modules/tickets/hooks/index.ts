import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "../api";
import type { CreateTicketInput, AddTicketMessageInput, AssignTicketInput, ResolveTicketInput } from "../validators";

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["tickets", id],
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
  });
}

export function useUserTickets(userId: string) {
  return useQuery({
    queryKey: ["tickets", "user", userId],
    queryFn: () => ticketsApi.getUserTickets(userId),
    enabled: !!userId,
  });
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["tickets", ticketId, "messages"],
    queryFn: () => ticketsApi.getMessages(ticketId),
    enabled: !!ticketId,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["tickets", "departments"],
    queryFn: () => ticketsApi.getDepartments(),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketInput) => ticketsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddTicketMessageInput) => ticketsApi.addMessage(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignTicketInput) => ticketsApi.assign(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useResolveTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResolveTicketInput) => ticketsApi.resolve(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketsApi.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}
