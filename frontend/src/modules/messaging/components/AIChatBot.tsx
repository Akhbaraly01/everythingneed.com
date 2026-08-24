import { useState, useRef, useEffect } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { db } from "@core/api/laravelGateway";
import { MessageCircle, Send, X, Loader2, Bot, User, Globe } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatBotProps {
  context?: 'learn' | 'healthcare' | 'needs' | 'general';
  title?: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'sw', name: 'Kiswahili' },
];

const AIChatBot = ({ context = 'general', title = 'AI Research Assistant' }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Edge function calls will be implemented via HTTP adapter
      // TODO: Call aiResearchAssistant from @core/services/edge
      //   body: {
      //     message: userMessage.content,
      //     language,
      //     context,
      //   },
      // });
      const data = { reply: '' };
      const error = null;

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getContextPlaceholder = () => {
    switch (context) {
      case 'learn':
        return 'Ask about courses, learning topics, research...';
      case 'healthcare':
        return 'Ask about health, prevention, wellness...';
      case 'needs':
        return 'Ask about services, products, requirements...';
      default:
        return 'Ask me anything...';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-40 right-4 z-50 w-[350px] md:w-[400px] shadow-2xl border-2">
          <CardHeader className="pb-2 bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[100px] h-8 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px] p-4" ref={scrollAreaRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Hello! I'm your AI assistant. Ask me anything about{' '}
                    {context === 'learn' && 'courses, learning resources, or research topics'}
                    {context === 'healthcare' && 'health, prevention, or wellness'}
                    {context === 'needs' && 'services, products, or your requirements'}
                    {context === 'general' && 'any topic you need help with'}
                    .
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getContextPlaceholder()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AIChatBot;
