import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, Edit, Trash2 } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    http.get<{ data?: any[] }>(`${API}/categories`).then(res => setCategories(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    try {
      await http.post(`${API}/categories`, { name: newName });
      setNewName("");
      fetchCategories();
    } catch {}
  };

  const deleteCategory = async (id: string) => {
    try {
      await http.delete(`${API}/categories/${id}`);
      fetchCategories();
    } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><Layers className="h-8 w-8" /> Categories</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Button onClick={createCategory}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Card key={cat.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.children?.length || 0} subcategories</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Active" : "Inactive"}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
