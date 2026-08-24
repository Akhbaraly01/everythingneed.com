import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell } from "lucide-react";

const preferences = [
  { id: "email_orders", label: "Order updates via email", default: true },
  { id: "email_promotions", label: "Promotional emails", default: false },
  { id: "push_orders", label: "Order updates via push", default: true },
  { id: "push_messages", label: "New messages via push", default: true },
  { id: "sms_orders", label: "Order updates via SMS", default: false },
  { id: "sms_delivery", label: "Delivery alerts via SMS", default: true },
];

export function NotificationPreferences() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.map((pref) => (
            <div key={pref.id} className="flex items-center justify-between py-2">
              <label className="text-sm font-medium">{pref.label}</label>
              <Switch defaultChecked={pref.default} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button>Save Preferences</Button>
    </div>
  );
}

export default NotificationPreferences;
