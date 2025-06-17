
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Bot, Send, User, Loader2, Brain, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateChatbotResponse } from "@/services/chatbotService";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  source?: 'knowledge-base' | 'ai' | 'fallback';
}

interface UserInfo {
  name: string;
  email: string;
}

const ChatbotPage = () => {
  const { chatbotId } = useParams();
  const { toast } = useToast();
  const [showUserDialog, setShowUserDialog] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", email: "" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotName, setChatbotName] = useState("AI Assistant");
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chatbot data - in real app this would come from API
  useEffect(() => {
    if (chatbotId) {
      const mockChatbots: { [key: string]: string } = {
        "customer-support-bot-abc123": "Customer Support Bot",
        "sales-assistant-def456": "Sales Assistant",
        "faq-bot-ghi789": "FAQ Bot"
      };
      
      const name = mockChatbots[chatbotId] || "AI Assistant";
      setChatbotName(name);
    }
  }, [chatbotId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.name.trim() || !userInfo.email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both name and email",
        variant: "destructive",
      });
      return;
    }

    setShowUserDialog(false);
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: "welcome",
      content: `Hello ${userInfo.name}! I'm ${chatbotName}. I can answer questions based on my knowledge base or use AI to help with other topics. How can I assist you today?`,
      sender: "bot",
      timestamp: new Date(),
      source: 'knowledge-base'
    };
    setMessages([welcomeMessage]);

    toast({
      title: "Welcome!",
      description: `Chat session started with ${chatbotName}`,
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Update conversation history
    const newHistory = [...conversationHistory, { role: 'user' as const, content: inputMessage }];
    setConversationHistory(newHistory);
    
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get intelligent response
      const response = await generateChatbotResponse(inputMessage, chatbotName, newHistory);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: "bot",
        timestamp: new Date(),
        source: response.source
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Update conversation history with bot response
      setConversationHistory(prev => [...prev, { role: 'assistant' as const, content: response.content }]);
      
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your message. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        source: 'fallback'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'knowledge-base':
        return <Database className="h-3 w-3 text-blue-500" />;
      case 'ai':
        return <Brain className="h-3 w-3 text-purple-500" />;
      default:
        return <Bot className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'knowledge-base':
        return 'Knowledge Base';
      case 'ai':
        return 'AI Generated';
      default:
        return 'Bot';
    }
  };

  return (
    <>
      {/* User Info Dialog */}
      <Dialog open={showUserDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Welcome to {chatbotName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserInfoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={userInfo.name}
                onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={userInfo.email}
                onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full">
              Start Chat
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chat Interface */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{chatbotName}</h1>
                <p className="text-sm text-gray-600">Intelligent AI Assistant with Custom Knowledge</p>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
          <Card className="h-[calc(100vh-200px)] bg-white/80 backdrop-blur-sm border-0 shadow-lg flex flex-col">
            <CardContent className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    message.sender === "user" 
                      ? "bg-indigo-100" 
                      : "bg-gradient-to-r from-indigo-600 to-purple-600"
                  }`}>
                    {message.sender === "user" ? (
                      <User className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.sender === "bot" && message.source && (
                        <div className="flex items-center gap-1 text-xs opacity-70">
                          {getSourceIcon(message.source)}
                          <span>{getSourceLabel(message.source)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ChatbotPage;
