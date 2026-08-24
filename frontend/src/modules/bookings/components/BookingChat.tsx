import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";

interface BookingChatProps {
  bookingId: string;
  workerId?: string;
  onClose?: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

const BookingChat = ({ bookingId, workerId, onClose }: BookingChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get or create conversation
  const { data: conversation } = useQuery({
    queryKey: ["booking-conversation", bookingId],
    queryFn: async () => {
      // First try to find existing conversation
      const existing = await db
        .from("chat_conversations")
        .select("*")
        .where("booking_id", "=", bookingId)
        .single();

      if (existing) return existing;

      // Create new conversation
      const newConv = await db
        .from("chat_conversations")
        .insert({
          booking_id: bookingId,
          customer_id: user?.id,
          worker_id: workerId || null,
        })
        .single();

      if (!newConv) throw new Error("Failed to create conversation");
      return newConv;
    },
    enabled: !!bookingId && !!user?.id,
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", conversation?.id],
    queryFn: async () => {
      const data = await db
        .from("chat_messages")
        .select("*")
        .where("conversation_id", "=", conversation?.id)
        .orderBy("created_at", true);

      return (data ?? []) as Message[];
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      await db.from("chat_messages").insert({
        conversation_id: conversation?.id,
        sender_id: user?.id,
        message,
        message_type: "text",
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", conversation?.id] });
    },
  });

  // TODO: Realtime subscriptions will be implemented via WebSocket adapter
  useEffect(() => {
    if (!conversation?.id) return;

    // TODO: Realtime subscriptions will be implemented via WebSocket adapter
  }, [conversation?.id, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="py-3 px-4 border-b flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Chat with Service Worker</CardTitle>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                        {isMe ? "Y" : "W"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? "text-right" : ""}`}>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <CardContent className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingChat;
