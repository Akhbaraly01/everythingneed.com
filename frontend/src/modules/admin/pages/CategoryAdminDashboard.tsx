import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Input } from "@shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/ui/table";
import { db } from "@core/api/laravelGateway";
import { useToast } from "@/hooks/use-toast";
import { 
  FolderOpen, Ticket, Store, Package, TrendingUp, 
  Search, Eye, Edit, Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface NeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
}

interface NeedItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_available: boolean;
  category_id: string;
}

const chartData = [
  { name: "Mon", items: 45 },
  { name: "Tue", items: 52 },
  { name: "Wed", items: 49 },
  { name: "Thu", items: 63 },
  { name: "Fri", items: 58 },
  { name: "Sat", items: 71 },
  { name: "Sun", items: 43 },
];

const pieData = [
  { name: "Transportation", value: 30, color: "#3B82F6" },
  { name: "Healthcare", value: 25, color: "#EC4899" },
  { name: "Food", value: 20, color: "#EF4444" },
  { name: "Jobs", value: 15, color: "#F59E0B" },
  { name: "Others", value: 10, color: "#6366F1" },
];

const CategoryAdminDashboard = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<NeedCategory[]>([]);
  const [items, setItems] = useState<NeedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NeedCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setCategories((await db
        .from("need_categories")
        .select("*")
        .orderBy("sort_order")) as NeedCategory[]);

      setItems((await db
        .from("need_items")
        .select("*")) as NeedItem[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCategory || !newItem.name) return;

    try {
      await db.from("need_items").insert({
        category_id: selectedCategory.id,
        name: newItem.name,
        description: newItem.description,
        price: newItem.price ? parseFloat(newItem.price) : null,
      });

      toast({
        title: "Item Added",
        description: "New item has been added successfully",
      });

      setDialogOpen(false);
      setNewItem({ name: "", description: "", price: "" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await db
        .from("need_items")
        .update({ is_available: !currentStatus })
        .where("id", "=", itemId);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item availability",
        variant: "destructive",
      });
    }
  };

  const stats = [
    { title: "Total Categories", value: categories.length, icon: FolderOpen, color: "text-primary" },
    { title: "Total Items", value: items.length, icon: Package, color: "text-secondary" },
    { title: "Available Items", value: items.filter(i => i.is_available).length, icon: TrendingUp, color: "text-success" },
    { title: "Pending Review", value: items.filter(i => !i.is_available).length, icon: Ticket, color: "text-warning" },
  ];

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryItems = (categoryId: string) => {
    return items.filter(item => item.category_id === categoryId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderOpen className="h-8 w-8 text-secondary" />
              Category Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage categories and items in your domain</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Items added per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="items" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Items by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="items">All Items</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Need Categories</CardTitle>
                    <CardDescription>Manage all 30 human need categories</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory(category)}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: category.color + "20", color: category.color }}
                          >
                            📦
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getCategoryItems(category.id).length} items
                            </p>
                          </div>
                          <Badge variant="outline">{category.slug}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Category Items */}
            {selectedCategory && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{selectedCategory.name} Items</CardTitle>
                      <CardDescription>{selectedCategory.description}</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Item</DialogTitle>
                          <DialogDescription>
                            Add a new item to {selectedCategory.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Item Name</Label>
                            <Input
                              value={newItem.name}
                              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                              placeholder="Enter item name"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newItem.description}
                              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                              placeholder="Enter description"
                            />
                          </div>
                          <div>
                            <Label>Price (optional)</Label>
                            <Input
                              type="number"
                              value={newItem.price}
                              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <Button onClick={handleAddItem} className="w-full">Add Item</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCategoryItems(selectedCategory.id).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.description || "N/A"}</TableCell>
                          <TableCell>{item.price ? `$${item.price.toFixed(2)}` : "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={item.is_available ? "default" : "secondary"}>
                              {item.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleAvailability(item.id, item.is_available)}
                            >
                              {item.is_available ? "Disable" : "Enable"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {getCategoryItems(selectedCategory.id).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No items in this category. Add one to get started!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Items Tab */}
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>All Items</CardTitle>
                <CardDescription>View and manage all items across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.slice(0, 20).map((item) => {
                      const category = categories.find(c => c.id === item.category_id);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{category?.name || "Unknown"}</Badge>
                          </TableCell>
                          <TableCell>{item.price ? `$${item.price.toFixed(2)}` : "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={item.is_available ? "default" : "secondary"}>
                              {item.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryAdminDashboard;
