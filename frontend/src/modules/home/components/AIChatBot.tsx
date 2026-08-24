import { useState } from "react";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { MessageCircle, X, Send } from "lucide-react";

interface AIChatBotProps {
  context?: string;
  title?: string;
}

const AIChatBot = ({ context = "general", title = "AI Assistant" }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl z-50 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 w-80 h-96 z-50 animate-in slide-in-from-bottom-4">
      <Card className="h-full flex flex-col shadow-2xl border-primary/20">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="flex-1 p-3 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Hello! How can I help you today?
          </p>
        </CardContent>
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="icon" className="h-9 w-9 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIChatBot;
