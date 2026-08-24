import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { Badge } from "@shared/ui/badge";
import { ScrollArea } from "@shared/ui/scroll-area";
import { 
  Send, X, Minimize2, Maximize2, Search, 
  MessageCircle, Phone, Video, MoreVertical, Check, CheckCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { http } from "@core/api";
import { listenToChatChannel } from "@core/realtime/echo";
const API = import.meta.env.VITE_API_URL || "/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
}

interface Conversation {
  id: string;
  customer_id: string;
  worker_id: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
  otherUser?: {
    name: string;
    avatar: string;
    online: boolean;
  };
  lastMessage?: string;
  unreadCount?: number;
}

interface RealtimeChatProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
  bookingId?: string;
}

const RealtimeChat = ({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName = "Support",
  recipientAvatar,
  bookingId 
}: RealtimeChatProps) => {
  const { user, profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', bookingId, recipientId],
    queryFn: async () => {
      if (!user?.id) return null;

      const res = await http.post<{ data: Conversation | null }>(
        `${API}/chat/conversations`,
        {
          recipient_id: recipientId || undefined,
          booking_id: bookingId || undefined,
        }
      );

      const existing = res.data;
      if (existing) setActiveConversation(existing.id);
      return existing;
    },
    enabled: !!user?.id && isOpen,
    retry: false,
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat_messages', activeConversation],
    queryFn: async () => {
      if (!activeConversation) return [];

      const res = await http.get<{ data: Message[] }>(
        `${API}/chat/${activeConversation}/messages`
      );
      return (res.data ?? []) as Message[];
    },
    enabled: !!activeConversation,
  });

  // Live updates over Reverb
  useEffect(() => {
    if (!activeConversation) return;

    const unsubscribe = listenToChatChannel(activeConversation, () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', activeConversation] });
    });

    return unsubscribe;
  }, [activeConversation, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!user?.id || !activeConversation) throw new Error('Not authenticated');

      const res = await http.post<{ data: Message }>(
        `${API}/chat/${activeConversation}/messages`,
        { message: messageText, message_type: 'text' }
      );
      return res.data;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['chat_messages', activeConversation] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error('Send error:', error);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-64 h-14' : 'w-80 md:w-96 h-[500px]'}`}>
      <Card className="h-full flex flex-col shadow-xl border-2">
        {/* Header */}
        <CardHeader className="p-3 border-b bg-primary text-primary-foreground rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/30">
                <AvatarImage src={recipientAvatar} />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                  {recipientName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{recipientName}</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs opacity-80">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                            <span className="text-[10px] opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {isOwn && (
                              msg.is_read ? (
                                <CheckCheck className="h-3 w-3 text-blue-400" />
                              ) : (
                                <Check className="h-3 w-3 opacity-70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t flex-shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default RealtimeChat;
