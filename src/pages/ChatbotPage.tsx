import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Loader2, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseChatbotService, generateChatbotResponse } from "@/services/supabaseChatbotService";

const ChatbotPage = () => {
  const { chatbotId } = useParams();
  const [messages, setMessages] = useState<Array<{role: string, content: string, timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get chatbot details
  const { data: chatbot, isLoading: chatbotLoading } = useQuery({
    queryKey: ['chatbot', chatbotId],
    queryFn: () => supabaseChatbotService.getChatbotById(chatbotId!),
    enabled: !!chatbotId,
  });

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      if (chatbotId && !sessionId) {
        try {
          const session = await supabaseChatbotService.createChatSession(chatbotId);
          setSessionId(session.id);
          
          // Load existing messages if any
          const existingMessages = await supabaseChatbotService.getMessagesBySession(session.id);
          setMessages(existingMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at)
          })));
        } catch (error) {
          console.error('Failed to create session:', error);
        }
      }
    };

    initSession();
  }, [chatbotId, sessionId]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || !chatbotId) return;

    const userMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await generateChatbotResponse(currentMessage, chatbotId, sessionId);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (chatbotLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chatbot Not Found</h2>
          <p className="text-gray-600">The chatbot you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[90vh] flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                  <CardDescription className="text-blue-100">
                    {chatbot.description || 'AI Assistant'}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 w-fit max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.content}
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg p-3 w-fit max-w-[80%] bg-gray-100 text-gray-800">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotPage;
