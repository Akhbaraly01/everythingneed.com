import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Ticket, ArrowLeft, Send } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string | null;
}

const CreateTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    department_id: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = (await db.from("departments").select("*")) as Department[];
      setDepartments(data || []);
    } catch {
      setDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to submit a ticket",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const data = await db.from("tickets").insert([{
        subject: formData.subject,
        description: formData.description,
        department_id: formData.department_id || null,
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        user_id: user.id,
        ticket_number: `TKT-${Date.now()}`,
      }]).single();

      if (!data) throw new Error("Failed to create ticket");

      toast({
        title: "Ticket Created",
        description: `Your ticket ${data.ticket_number} has been submitted successfully`,
      });

      navigate("/support/tickets");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-primary py-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="text-primary-foreground mb-4 hover:bg-primary-foreground/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground flex items-center gap-3">
            <Ticket className="h-10 w-10" />
            Submit Support Ticket
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            Describe your issue and we'll get back to you as soon as possible
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>New Support Request</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us assist you better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General inquiry</SelectItem>
                      <SelectItem value="medium">Medium - Need assistance</SelectItem>
                      <SelectItem value="high">High - Important issue</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical problem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about your issue, including any steps to reproduce the problem..."
                  rows={8}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTicket;
