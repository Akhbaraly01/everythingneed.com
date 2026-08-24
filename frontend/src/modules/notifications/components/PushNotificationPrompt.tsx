import { useState, useEffect } from "react";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Show prompt after 3 seconds if notifications not enabled
    const timer = setTimeout(() => {
      if (isSupported && permission === "default") {
        const dismissed = localStorage.getItem("push-prompt-dismissed");
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("push-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Enable Notifications</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get instant alerts when your orders or tickets are updated
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEnable}>
                  Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Not Now
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationPrompt;
