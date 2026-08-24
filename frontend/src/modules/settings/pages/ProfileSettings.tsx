import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, Bell, ArrowLeft } from "lucide-react";

export function ProfileSettings() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <input className="w-full border rounded-md px-3 py-2 mt-1" placeholder="First name" />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <input className="w-full border rounded-md px-3 py-2 mt-1" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="w-full border rounded-md px-3 py-2 mt-1" type="email" placeholder="Email" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input className="w-full border rounded-md px-3 py-2 mt-1" type="tel" placeholder="Phone number" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileSettings;
