import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("learn_direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user?.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!user?.id && !!receiverId,
    refetchInterval: 3000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from("learn_direct_messages").insert({
        sender_id: user?.id,
        receiver_id: receiverId,
        message,
        post_id: postId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["direct-messages", user?.id, receiverId] });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Subscribe to real-time messages
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const channel = supabase
      .channel(`dm-${user.id}-${receiverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "learn_direct_messages",
        },
        (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === user.id && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ["direct-messages", user.id, receiverId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
