import { useState } from "react";
import { ArrowLeft, Search, MessageSquare, Calendar, Clock, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getChatSessionsByUserEmail, getAllChatbots, getSessionMessages } from "@/services/supabaseChatbotService";

const ViewSessions = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const defaultEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState(defaultEmail);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", searchEmail],
    queryFn: () => getChatSessionsByUserEmail(searchEmail),
    enabled: !!searchEmail,
  });

  const { data: chatbots = [], isLoading: isLoadingChatbots } = useQuery({
    queryKey: ["all-chatbots"],
    queryFn: getAllChatbots,
  });

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["session-messages", expandedSessionId],
    queryFn: () => (expandedSessionId ? getSessionMessages(expandedSessionId) : []),
    enabled: !!expandedSessionId,
  });

  const filteredSessions = sessions.filter(session =>
    (session.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
    ) : (
      <Badge variant="secondary">Completed</Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Chat Sessions
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Chatbot Count */}
          <div className="mb-6 flex items-center gap-4">
            <Bot className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-semibold">Total Chatbots:</span>
            <span className="text-2xl font-bold">
              {isLoadingChatbots ? "..." : chatbots.length}
            </span>
          </div>

          {/* Email Search */}
          <div className="flex items-center gap-4 mb-4">
            <Input
              type="email"
              placeholder="Enter email to view sessions..."
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-sm text-muted-foreground">(Email used in chat modal)</span>
          </div>

          {/* Search and Table */}
          <div className="flex items-center justify-between mb-6">
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No sessions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map(session => (
                  <>
                    <TableRow key={session.id} className="cursor-pointer" onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}>
                      <TableCell>{session.id}</TableCell>
                      <TableCell>{session.user_name || "-"}</TableCell>
                      <TableCell>{session.user_email || "-"}</TableCell>
                      <TableCell>{formatTime(session.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(session.is_active)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          {expandedSessionId === session.id ? "Hide" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedSessionId === session.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50">
                          {isLoadingMessages ? (
                            <div className="text-center py-4 text-muted-foreground">Loading messages...</div>
                          ) : messages.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No messages found for this session.</div>
                          ) : (
                            <Table className="mt-2">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Content</TableHead>
                                  <TableHead>Date/Time</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {messages.map(msg => (
                                  <TableRow key={msg.id}>
                                    <TableCell>{msg.role}</TableCell>
                                    <TableCell>{msg.content}</TableCell>
                                    <TableCell>{formatTime(msg.created_at)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSessions;
