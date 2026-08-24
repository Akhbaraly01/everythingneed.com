import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

interface TicketMessage {
  id: string;
  message: string;
  sender: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  messages: TicketMessage[];
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  resolved: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");

  const { data: ticket, isLoading, refetch } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/support/tickets/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await http.post(`/api/support/tickets/${id}/messages`, { message: newMessage });
    setNewMessage("");
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button variant="link" onClick={() => navigate("/tickets")}>Back to tickets</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <div className="flex gap-2 mt-1">
            <Badge className={statusColors[ticket.status] || "bg-gray-100"}>{ticket.status}</Badge>
            <Badge variant="outline">{ticket.priority}</Badge>
            <Badge variant="outline">{ticket.category}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {ticket.messages?.map((msg) => (
              <div key={msg.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{msg.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {ticket.status !== "closed" && (
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default TicketDetailPage;
