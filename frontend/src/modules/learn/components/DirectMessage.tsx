import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DirectMessageProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  postId?: string;
}

const DirectMessage = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  receiverAvatar,
  postId,
}: DirectMessageProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages between current user and receiver
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["direct-messages", user?.id, receiverId],
    queryFn: async () => {
      const data = await db
        .from("learn_direct_messages")
        .select("*")
        .where("sender_id", "=", user?.id)
        .where("receiver_id", "=", receiverId)
        .orderBy("created_at", true);

      if (!Array.isArray(data)) throw new Error("Unexpected messages response");
      return data;
    },
    enabled: isOpen && !!user?.id && !!receiverId,
    refetchInterval: 3000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      await db.from("learn_direct_messages").insert({
        sender_id: user?.id,
        receiver_id: receiverId,
        message,
        post_id: postId || null,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["direct-messages", user?.id, receiverId] });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // TODO: Realtime subscriptions will be implemented via WebSocket adapter
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    // TODO: Realtime subscriptions will be implemented via WebSocket adapter
  }, [isOpen, user?.id, receiverId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !user) {
      if (!user) toast.error("Please sign in to send messages");
      return;
    }
    sendMessageMutation.mutate(newMessage.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={receiverAvatar} />
              <AvatarFallback>{receiverName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base">{receiverName}</DialogTitle>
              <p className="text-xs text-muted-foreground">Direct message</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Say hello to {receiverName}!</p>
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
                        {isMe ? (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            Y
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={receiverAvatar} />
                            <AvatarFallback>{receiverName[0]?.toUpperCase()}</AvatarFallback>
                          </>
                        )}
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

        <div className="p-4 border-t">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessage;
