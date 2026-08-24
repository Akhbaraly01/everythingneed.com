import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Key, ArrowLeft } from "lucide-react";

export function SecuritySettings() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Security Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Current Password</label>
            <input className="w-full border rounded-md px-3 py-2 mt-1" type="password" />
          </div>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <input className="w-full border rounded-md px-3 py-2 mt-1" type="password" />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm New Password</label>
            <input className="w-full border rounded-md px-3 py-2 mt-1" type="password" />
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Add an extra layer of security to your account.</p>
          <Button variant="outline">Enable 2FA</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecuritySettings;
