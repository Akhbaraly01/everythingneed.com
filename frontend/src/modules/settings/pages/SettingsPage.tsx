import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Save } from "lucide-react";
import { http } from "@core/api";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    http.get<any>(`${API}/settings`).then(res => setSettings(res.data?.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await http.put(`${API}/settings`, { settings: settingsArray });
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="h-8 w-8" /> Settings</h1>
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
      </div>
      <div className="grid gap-4">
        {Object.entries(settings).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">{String(value)}</p>
                </div>
                <Badge variant="outline">{typeof value}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {Object.keys(settings).length === 0 && !loading && <p className="text-center text-muted-foreground py-8">No settings configured</p>}
      </div>
    </div>
  );
}
