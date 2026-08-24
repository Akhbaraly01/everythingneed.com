import { useState, useEffect } from "react";
import Layout from "@shared/app-shell/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import { Button } from "@shared/ui/button";
import { Bell, BellOff, Package, Ticket, Calendar, Megaphone, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationPreferences {
  pushEnabled: boolean;
  orderUpdates: boolean;
  ticketReplies: boolean;
  appointmentReminders: boolean;
  promotions: boolean;
  announcements: boolean;
}

const NotificationSettings = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: false,
    orderUpdates: true,
    ticketReplies: true,
    appointmentReminders: true,
    promotions: false,
    announcements: true,
  });

  useEffect(() => {
    // Check notification permission status
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
      setPreferences(prev => ({
        ...prev,
        pushEnabled: Notification.permission === "granted"
      }));
    }

    // Load saved preferences from localStorage
    const saved = localStorage.getItem("notificationPreferences");
    if (saved) {
      setPreferences(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === "granted") {
        setPreferences(prev => ({ ...prev, pushEnabled: true }));
        toast.success("Push notifications enabled!");
        
        // Show test notification
        new Notification("Notifications Enabled", {
          body: "You will now receive push notifications for important updates.",
          icon: "/favicon.ico"
        });
      } else if (permission === "denied") {
        toast.error("Push notifications blocked. Please enable them in your browser settings.");
      }
    } catch (error) {
      toast.error("Failed to enable push notifications");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
    toast.success("Preference saved");
  };

  const saveAllPreferences = () => {
    localStorage.setItem("notificationPreferences", JSON.stringify(preferences));
    toast.success("All notification preferences saved");
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
              <p className="text-muted-foreground">Please sign in to manage your notification settings.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage how and when you receive notifications
          </p>
        </div>

        <div className="space-y-6">
          {/* Push Notification Permission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {permissionStatus === "granted" ? (
                  <Bell className="h-5 w-5 text-green-500" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                Push Notifications
              </CardTitle>
              <CardDescription>
                Receive real-time notifications even when you're not on the site
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionStatus === "granted" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Push notifications are enabled</span>
                </div>
              ) : permissionStatus === "denied" ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">
                    Push notifications are blocked. To enable them:
                  </p>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Click the lock icon in your browser's address bar</li>
                    <li>Find "Notifications" in the permissions</li>
                    <li>Change it from "Block" to "Allow"</li>
                    <li>Refresh the page</li>
                  </ol>
                </div>
              ) : (
                <Button onClick={requestPushPermission} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Enable Push Notifications
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notification Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Categories</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Label htmlFor="orderUpdates" className="font-medium">Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about order status changes
                    </p>
                  </div>
                </div>
                <Switch
                  id="orderUpdates"
                  checked={preferences.orderUpdates}
                  onCheckedChange={(checked) => handlePreferenceChange("orderUpdates", checked)}
                />
              </div>

              {/* Ticket Replies */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Ticket className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <Label htmlFor="ticketReplies" className="font-medium">Ticket Replies</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when support replies to your tickets
                    </p>
                  </div>
                </div>
                <Switch
                  id="ticketReplies"
                  checked={preferences.ticketReplies}
                  onCheckedChange={(checked) => handlePreferenceChange("ticketReplies", checked)}
                />
              </div>

              {/* Appointment Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="appointmentReminders" className="font-medium">Appointment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders for upcoming healthcare appointments
                    </p>
                  </div>
                </div>
                <Switch
                  id="appointmentReminders"
                  checked={preferences.appointmentReminders}
                  onCheckedChange={(checked) => handlePreferenceChange("appointmentReminders", checked)}
                />
              </div>

              {/* Promotions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Megaphone className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <Label htmlFor="promotions" className="font-medium">Promotions & Offers</Label>
                    <p className="text-sm text-muted-foreground">
                      Deals, discounts, and special offers
                    </p>
                  </div>
                </div>
                <Switch
                  id="promotions"
                  checked={preferences.promotions}
                  onCheckedChange={(checked) => handlePreferenceChange("promotions", checked)}
                />
              </div>

              {/* Announcements */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Bell className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <Label htmlFor="announcements" className="font-medium">Platform Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Important updates and new features
                    </p>
                  </div>
                </div>
                <Switch
                  id="announcements"
                  checked={preferences.announcements}
                  onCheckedChange={(checked) => handlePreferenceChange("announcements", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={saveAllPreferences} className="w-full">
            Save All Preferences
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationSettings;
