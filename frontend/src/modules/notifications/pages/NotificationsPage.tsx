import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get<any>(`${API}/notifications`).then(res => {
      setNotifications(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await http.post(`${API}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await http.post(`${API}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" /> Notifications
          {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-2" />Mark all read</Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <Card key={n.id} className={n.read_at ? "opacity-60" : "border-l-4 border-l-primary"}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{n.data?.title || n.type}</p>
                  <p className="text-sm text-muted-foreground">{n.data?.message || ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.read_at && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && !loading && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No notifications</CardContent></Card>
        )}
      </div>
    </div>
  );
}
