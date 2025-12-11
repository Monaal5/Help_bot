import { useState, useEffect } from 'react';
import { useUser, UserButton } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Search, Calendar, User, Bot, Eye, ArrowLeft, Info, CheckCircle } from "lucide-react";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";
import { ChatSession } from "@/types/database";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const ViewSessions = () => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatbot, setSelectedChatbot] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user is a viewer (has no chatbots but has viewer permissions)
  const { data: userChatbots } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: () => supabaseChatbotService.getChatbotsByUser(user?.id || ''),
    enabled: !!user?.id,
  });

  const isViewer = userChatbots?.length === 0;

  // Get sessions based on user role
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', user?.id, selectedChatbot, isViewer],
    queryFn: async () => {
      if (isViewer && user?.emailAddresses?.[0]?.emailAddress) {
        // Viewer: get sessions from permitted chatbots
        return await supabaseChatbotService.getAllSessionsForViewer(user.emailAddresses[0].emailAddress);
      } else if (selectedChatbot === 'all') {
        // Admin: get all sessions from all their chatbots
        const allSessions: ChatSession[] = [];
        if (userChatbots) {
          for (const chatbot of userChatbots) {
            const chatbotSessions = await supabaseChatbotService.getChatSessionsByChatbot(chatbot.id);
            allSessions.push(...chatbotSessions);
          }
        }
        return allSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        // Admin: get sessions for specific chatbot
        return await supabaseChatbotService.getChatSessionsByChatbot(selectedChatbot);
      }
    },
    enabled: !!user && (isViewer || !!userChatbots),
  });

  // Get chatbots for filter dropdown (admin only)
  const { data: chatbots = [] } = useQuery({
    queryKey: ['chatbots-for-filter', user?.id],
    queryFn: () => supabaseChatbotService.getChatbotsByUser(user?.id || ''),
    enabled: !!user?.id && !isViewer,
  });

  // Get messages for selected session
  const { data: messages = [] } = useQuery({
    queryKey: ['session-messages', selectedSession?.id],
    queryFn: () => selectedSession ? supabaseChatbotService.getMessagesBySession(selectedSession.id) : Promise.resolve([]),
    enabled: !!selectedSession,
  });

  // Show onboarding for first-time viewers
  useEffect(() => {
    if (isViewer && sessions.length > 0) {
      const hasSeenOnboarding = localStorage.getItem('viewer-onboarding-seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isViewer, sessions.length]);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session =>
    session.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOnboardingComplete = () => {
    localStorage.setItem('viewer-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!isViewer && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isViewer ? 'Session Viewer' : 'Chat Sessions'}
                </h1>
                <p className="text-gray-600">
                  {isViewer ? 'View permitted chat sessions' : 'Monitor and analyze conversations'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isViewer && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Viewer Access
                </Badge>
              )}
              <span className="text-sm text-gray-600">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Sessions
                </CardTitle>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Chatbot Filter (Admin only) */}
                {!isViewer && chatbots.length > 0 && (
                  <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by chatbot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chatbots</SelectItem>
                      {chatbots.map((chatbot) => (
                        <SelectItem key={chatbot.id} value={chatbot.id}>
                          {chatbot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>

              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sessions found</p>
                    {isViewer && (
                      <p className="text-sm mt-2">
                        Contact an admin to get viewer access to chatbot sessions.
                      </p>
                    )}
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedSession?.id === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">
                            {session.user_name || 'Anonymous'}
                          </span>
                        </div>
                        <Badge variant={session.is_active ? "default" : "secondary"} className="text-xs">
                          {session.is_active ? "active" : "ended"}
                        </Badge>
                      </div>

                      {session.user_email && (
                        <p className="text-xs text-gray-600 mb-2">{session.user_email}</p>
                      )}
                      {session.phone_number && (
                        <p className="text-xs text-gray-600 mb-2">{session.phone_number}</p>
                      )}


                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>

                      <div className="text-xs text-gray-400 mt-1 truncate">
                        ID: {session.id}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              {selectedSession ? (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Session Details
                      </div>
                      <Badge variant={selectedSession.is_active ? "default" : "secondary"}>
                        {selectedSession.is_active ? "Active" : "Ended"}
                      </Badge>
                    </CardTitle>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">User:</span>
                        <p className="text-gray-600">{selectedSession.user_name || 'Anonymous'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <p className="text-gray-600">{selectedSession.user_email || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone_Number:</span>
                        <p className="text-gray-600">{selectedSession.phone_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Started:</span>
                        <p className="text-gray-600">
                          {format(new Date(selectedSession.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Last Updated:</span>
                        <p className="text-gray-600">
                          {format(new Date(selectedSession.updated_at), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No messages in this session</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`rounded-lg p-3 max-w-[80%] ${
                                message.role === 'user'
                                  ? 'bg-blue-100 text-blue-800'
                                  : message.role === 'assistant'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium capitalize">
                                  {message.role}
                                </span>
                                {message.response_source && (
                                  <Badge variant="outline" className="text-xs">
                                    {message.response_source}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </div>
                              <div className="text-xs opacity-70 mt-2">
                                {format(new Date(message.created_at), 'HH:mm:ss')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select a Session</h3>
                    <p>Choose a session from the list to view its details and messages</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Onboarding Dialog for New Viewers */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Welcome, Viewer!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">You have viewer access!</span>
              </div>
              <p className="text-blue-700 text-sm">
                You can view and monitor chat sessions, but you cannot make any changes to the system.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">What you can do:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  View all chat sessions you have access to
                </li>
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-green-600" />
                  Search and filter sessions by user or content
                </li>
                <li className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  See user information and conversation details
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Monitor session timestamps and activity
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                <Info className="w-4 h-4 inline mr-1" />
                <strong>Note:</strong> You can only view sessions from chatbots you've been granted access to.
              </p>
            </div>

            <Button onClick={handleOnboardingComplete} className="w-full">
              Got it, let's start!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewSessions;