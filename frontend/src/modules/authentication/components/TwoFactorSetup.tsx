import { useState } from "react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import { Shield, Smartphone, Mail, Key, Check } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  onComplete: () => void;
}

const TwoFactorSetup = ({ onComplete }: TwoFactorSetupProps) => {
  const [emailOTP, setEmailOTP] = useState(true);
  const [smsOTP, setSmsOTP] = useState(false);
  const [authenticatorApp, setAuthenticatorApp] = useState(false);

  const handleSave = () => {
    if (!emailOTP && !smsOTP && !authenticatorApp) {
      toast.error("Please enable at least one 2FA method");
      return;
    }
    toast.success("2FA settings saved successfully");
    onComplete();
  };

  const handleSkip = () => {
    toast.info("You can enable 2FA later in your account settings");
    onComplete();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-success" />
        </div>
        <CardTitle className="text-xl">Secure Your Account</CardTitle>
        <CardDescription>
          Enable two-factor authentication for extra security
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email OTP */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="font-medium">Email OTP</Label>
              <p className="text-sm text-muted-foreground">Receive codes via email</p>
            </div>
          </div>
          <Switch
            checked={emailOTP}
            onCheckedChange={setEmailOTP}
          />
        </div>

        {/* SMS OTP */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <Label className="font-medium">SMS OTP</Label>
              <p className="text-sm text-muted-foreground">Receive codes via SMS</p>
            </div>
          </div>
          <Switch
            checked={smsOTP}
            onCheckedChange={setSmsOTP}
          />
        </div>

        {/* Authenticator App */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Key className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <Label className="font-medium">Authenticator App</Label>
              <p className="text-sm text-muted-foreground">Use Google/Microsoft Auth</p>
            </div>
          </div>
          <Switch
            checked={authenticatorApp}
            onCheckedChange={setAuthenticatorApp}
          />
        </div>

        {/* Security Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>
              Two-factor authentication adds an extra layer of security by requiring 
              a verification code in addition to your password.
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <Button onClick={handleSave} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Save 2FA Settings
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full">
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
