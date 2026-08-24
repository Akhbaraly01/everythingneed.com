import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Filter, MoreHorizontal, Trash2, Edit, DollarSign, Users, Ticket, Store } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { usersApi, vendorsApi, analyticsApi, supportApi, auditLogsApi } from "@modules/admin/services";

const defaultData = [
  { name: "Jan", users: 0, revenue: 0 }, { name: "Feb", users: 0, revenue: 0 },
  { name: "Mar", users: 0, revenue: 0 }, { name: "Apr", users: 0, revenue: 0 },
  { name: "May", users: 0, revenue: 0 }, { name: "Jun", users: 0, revenue: 0 },
];

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [analyticsData, setAnalyticsData] = useState(defaultData);
  const [stats, setStats] = useState({ total_users: 0, total_revenue: 0, total_orders: 0, active_vendors: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, vendorsRes, ticketsRes, analyticsRes, auditRes] = await Promise.allSettled([
        usersApi.list(), vendorsApi.list(), supportApi.list(), analyticsApi.overview(), auditLogsApi.list({ limit: 50 }),
      ]);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data || []);
      if (vendorsRes.status === "fulfilled") setVendors(vendorsRes.value.data || []);
      if (ticketsRes.status === "fulfilled") setTickets(ticketsRes.value.data || []);
      if (analyticsRes.status === "fulfilled" && analyticsRes.value.data) setStats(analyticsRes.value.data);
      if (auditRes.status === "fulfilled") setAuditLogs(auditRes.value.data || []);

      const [growthRes, revenueRes] = await Promise.allSettled([analyticsApi.userGrowth("180d"), analyticsApi.revenue("180d")]);
      if (growthRes.status === "fulfilled" && revenueRes.status === "fulfilled") {
        const growth = growthRes.value.data || [];
        const revenue = revenueRes.value.data || [];
        const merged = growth.map((g: any, i: number) => ({ name: g.label, users: g.value, revenue: revenue[i]?.value || 0 }));
        if (merged.length > 0) setAnalyticsData(merged.slice(-6));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await usersApi.updateRole(selectedUser.id, newRole);
      toast({ title: "Role Updated", description: `User role updated to ${newRole}` });
      setRoleDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    }
  };

  const handleVendorAction = async (vendorId: string, action: "approve" | "suspend") => {
    try {
      if (action === "approve") await vendorsApi.approve(vendorId);
      else await vendorsApi.suspend(vendorId);
      toast({ title: `Vendor ${action === "approve" ? "Approved" : "Suspended"}` });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to update vendor", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" /> Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your entire platform</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filters</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Users", value: stats.total_users, icon: Users, color: "text-primary" },
            { title: "Active Tickets", value: tickets.filter((t: any) => t.status !== "closed").length, icon: Ticket, color: "text-warning" },
            { title: "Vendors", value: stats.active_vendors, icon: Store, color: "text-success" },
            { title: "Revenue", value: `$${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: "text-secondary" },
          ].map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-full bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>User Growth</CardTitle><CardDescription>Monthly registrations</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Revenue</CardTitle><CardDescription>Monthly revenue</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div><CardTitle>User Management</CardTitle><CardDescription>Manage all users and roles</CardDescription></div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge variant={user.role === "super_admin" ? "default" : "secondary"}>{user.role?.replace("_", " ")}</Badge></TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setNewRole(user.role); setRoleDialogOpen(true); }}>
                                <Edit className="h-4 w-4 mr-2" />Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardHeader><CardTitle>Vendor Management</CardTitle><CardDescription>Manage store owners</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Store</TableHead><TableHead>Category</TableHead><TableHead>Verified</TableHead><TableHead>Rating</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vendors.map((vendor: any) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.store_name}</TableCell>
                        <TableCell>{vendor.category}</TableCell>
                        <TableCell><Badge variant={vendor.is_verified ? "default" : "outline"}>{vendor.is_verified ? "Verified" : "Pending"}</Badge></TableCell>
                        <TableCell>{vendor.rating?.toFixed(1) || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant={vendor.is_verified ? "outline" : "default"} size="sm" onClick={() => handleVendorAction(vendor.id, vendor.is_verified ? "suspend" : "approve")}>
                            {vendor.is_verified ? "Revoke" : "Approve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader><CardTitle>Support Tickets</CardTitle><CardDescription>Customer support tickets</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {tickets.slice(0, 10).map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell><Badge variant={ticket.status === "open" ? "destructive" : "secondary"}>{ticket.status}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{ticket.priority}</Badge></TableCell>
                        <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader><CardTitle>Audit Logs</CardTitle><CardDescription>Track all system activity</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Entity</TableHead><TableHead>Action</TableHead><TableHead>By</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {auditLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.entity_type}</TableCell>
                        <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{log.performed_by?.slice(0, 8)}...</TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update the role for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full border rounded p-2">
              <option value="user">User</option>
              <option value="customer_service">Customer Service</option>
              <option value="category_admin">Category Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <Button onClick={handleRoleChange} className="w-full">Update Role</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
