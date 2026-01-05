import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Send, Clock, User, Building, AlertCircle, 
  CheckCircle, XCircle, ArrowRightLeft, MessageSquare
} from "lucide-react";

interface TicketData {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  department_id: string | null;
  user_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  is_internal: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isStaff = hasRole("super_admin") || hasRole("category_admin") || hasRole("customer_service");

  useEffect(() => {
    if (id) fetchTicketData();
  }, [id]);

  const fetchTicketData = async () => {
    try {
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", id)
        .single();
      
      if (ticketData) setTicket(ticketData);

      const { data: messagesData } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });
      
      if (messagesData) setMessages(messagesData);

      const { data: deptData } = await supabase.from("departments").select("*");
      if (deptData) setDepartments(deptData);
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket || !user) return;

    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: newMessage,
        is_internal: isStaff ? isInternal : false,
      });

      if (error) throw error;

      setNewMessage("");
      fetchTicketData();

      toast({
        title: "Message Sent",
        description: "Your message has been added to the ticket",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus as "open" | "in_progress" | "pending" | "resolved" | "closed" })
        .eq("id", ticket.id);

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: ticket.id,
        action: "status_change",
        old_values: { status: ticket.status },
        new_values: { status: newStatus },
        performed_by: user!.id,
      });

      fetchTicketData();
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleTransferDepartment = async (newDeptId: string) => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ department_id: newDeptId })
        .eq("id", ticket.id);

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: ticket.id,
        action: "department_transfer",
        old_values: { department_id: ticket.department_id },
        new_values: { department_id: newDeptId },
        performed_by: user!.id,
      });

      fetchTicketData();
      toast({
        title: "Ticket Transferred",
        description: "Ticket has been transferred to another department",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer ticket",
        variant: "destructive",
      });
    }
  };

  const getDepartmentName = (id: string | null) => {
    if (!id) return "Unassigned";
    return departments.find(d => d.id === id)?.name || "Unknown";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
          <Button onClick={() => navigate("/support/tickets")}>Back to Tickets</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-primary py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="text-primary-foreground mb-4 hover:bg-primary-foreground/10"
            onClick={() => navigate("/support/tickets")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
                  {ticket.ticket_number}
                </Badge>
                <Badge variant={ticket.priority === "urgent" ? "destructive" : "secondary"}>
                  {ticket.priority}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{ticket.subject}</h1>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(ticket.status)}
              <Badge className="text-sm">
                {ticket.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                <Separator className="my-4" />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created: {new Date(ticket.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Department: {getDepartmentName(ticket.department_id)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation below.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender_id === user?.id ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {msg.sender_id === user?.id ? "You" : "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 max-w-[80%] ${msg.sender_id === user?.id ? "text-right" : ""}`}>
                        <div className={`inline-block p-3 rounded-lg ${
                          msg.sender_id === user?.id 
                            ? "bg-primary text-primary-foreground" 
                            : msg.is_internal 
                              ? "bg-warning/10 border border-warning/20" 
                              : "bg-muted"
                        }`}>
                          {msg.is_internal && (
                            <Badge variant="outline" className="mb-2 text-xs">Internal Note</Badge>
                          )}
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <Separator />

                {/* Reply Form */}
                <div className="space-y-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    {isStaff && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded"
                        />
                        Internal note (not visible to customer)
                      </label>
                    )}
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Number</p>
                  <p className="font-mono font-medium">{ticket.ticket_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={ticket.priority === "urgent" ? "destructive" : "secondary"} className="mt-1">
                    {ticket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{getDepartmentName(ticket.department_id)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Staff Actions */}
            {isStaff && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Update Status</p>
                    <Select value={ticket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4" />
                      Transfer Department
                    </p>
                    <Select 
                      value={ticket.department_id || ""} 
                      onValueChange={handleTransferDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
