import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Loader2 } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { supabaseChatbotService, generateChatbotResponse } from "@/services/supabaseChatbotService";
import { useToast } from "@/hooks/use-toast";
import { MediaDisplay } from '@/components/MediaDisplay';
import { MediaItem } from '@/types/database';

// Animated vertical three dots component
const AnimatedDots = () => (
  <div className="flex flex-col items-center justify-center h-6">
    <span className="block w-2 h-2 bg-gray-400 rounded-full mb-1 animate-bounce" style={{ animationDelay: '0ms' }}></span>
    <span className="block w-2 h-2 bg-gray-400 rounded-full mb-1 animate-bounce" style={{ animationDelay: '200ms' }}></span>
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
  </div>
);

const ChatbotPage = () => {
  const { chatbotId } = useParams();
  const [messages, setMessages] = useState<Array<{role: string, content: string, timestamp: Date, media?: MediaItem[]}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [typewriter, setTypewriter] = useState<{ index: number; words: string[]; current: string }>({
    index: -1,
    words: [],
    current: ''
  });
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Modal state for user info
  const [showUserModal, setShowUserModal] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Get chatbot details
  const { data: chatbot } = useQuery({
    queryKey: ['chatbot', chatbotId],
    queryFn: () => supabaseChatbotService.getChatbotById(chatbotId!),
    enabled: !!chatbotId,
  });

  // Create session on mount (after user info is provided)
  useEffect(() => {
    const initSession = async () => {
      if (chatbotId && !sessionId && userName && userEmail && userPhone) {
        try {
          const session = await supabaseChatbotService.createChatSession(chatbotId, {
            name: userName,
            email: userEmail,
            phone_number: userPhone
          });
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
          toast({
            variant: "destructive",
            description: "Failed to initialize chat session. Please try again."
          });
        }
      }
    };
    if (!showUserModal) {
      initSession();
    }
  }, [chatbotId, sessionId, toast, userName, userEmail, showUserModal]);

  // Auto-scroll to bottom when messages or typewriter changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typewriter]);

  // Typewriter effect for assistant
  useEffect(() => {
    if (typewriter.index >= 0 && typewriter.words.length > 0) {
      const fullText = typewriter.words.join(' ');
      if (typewriter.index < fullText.length) {
        const timeout = setTimeout(() => {
          setTypewriter(t => ({
            ...t,
            current: fullText.slice(0, t.index + 1),
            index: t.index + 1
          }));
        }, 18); // 18ms per character for a smooth effect
        return () => clearTimeout(timeout);
      } else {
        // When done, add the full message to messages
        setMessages(prev => [...prev.slice(0, -1), {
          ...prev[prev.length - 1],
          content: typewriter.current
        }]);
        setTypewriter({ index: -1, words: [], current: '' });
      }
    }
  }, [typewriter]);


  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Generate response (backend will handle media commands)
      const response = await generateChatbotResponse(
        userMessage,
        chatbotId!,
        sessionId
      );

      // Add AI response with media if present
      const aiMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        media: response.media || undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Only start typewriter effect for AI-generated responses (not media responses)
      if (response.isFromAI) {
        const words = response.content.split(' ');
        setTypewriter({ index: 0, words, current: '' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
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

  // User info modal
  if (showUserModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <Card className="w-full max-w-sm p-6">
          <CardHeader>
            <CardTitle>Enter your details</CardTitle>
            <CardDescription>To start chatting, please provide your name, email, and phone number (with country code).</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (userName.trim() && userEmail.trim() && userPhone.trim()) {
                  setShowUserModal(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <Input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone Number (with country code)</label>
                <Input
                  type="tel"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  required
                  placeholder="e.g. +1 555 1234567"
                />
              </div>
              <Button type="submit" className="w-full mt-2">Start Chatting</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Chatbot Not Found</h2>
            <p className="text-gray-600 mb-4">The requested chatbot could not be found.</p>
            <Link to="/dashboard">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-2rem)] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle>{chatbot.name}</CardTitle>
                  <CardDescription>{chatbot.description}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.role === 'assistant' && index === messages.length - 1 && typewriter.index >= 0 ? (
                      <div>{typewriter.current}</div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                    
                    {/* Display media if present */}
                    {message.media && message.media.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {message.media.map((media) => (
                          <MediaDisplay
                            key={media.id}
                            media={media}
                            showDetails={false}
                            className="max-w-xs"
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg p-3 w-fit max-w-[80%] bg-white text-gray-800 shadow-sm">
                    <AnimatedDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </CardContent>

          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask me anything or try: 'show me images of medical equipment' or 'I want videos about patient care'"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !currentMessage.trim()}>
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
