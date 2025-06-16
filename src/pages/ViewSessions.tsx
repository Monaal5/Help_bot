
import { useState } from "react";
import { ArrowLeft, Search, MessageSquare, Calendar, Clock, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Mock data for chat sessions
const mockSessions = [
  {
    id: "sess_1",
    chatbotName: "Customer Support Bot",
    userName: "John Doe",
    userEmail: "john@example.com",
    startTime: "2024-06-15 14:30:00",
    endTime: "2024-06-15 14:45:00",
    messageCount: 12,
    status: "completed",
    lastMessage: "Thank you for your help!",
    url: "https://chatbot-studio.app/chat/customer-support-abc123"
  },
  {
    id: "sess_2",
    chatbotName: "Sales Assistant",
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    startTime: "2024-06-15 15:20:00",
    endTime: null,
    messageCount: 8,
    status: "active",
    lastMessage: "Can you tell me more about pricing?",
    url: "https://chatbot-studio.app/chat/sales-assistant-def456"
  },
  {
    id: "sess_3",
    chatbotName: "FAQ Bot",
    userName: "Mike Johnson",
    userEmail: "mike@example.com",
    startTime: "2024-06-15 13:15:00",
    endTime: "2024-06-15 13:25:00",
    messageCount: 6,
    status: "completed",
    lastMessage: "That answers my question, thanks!",
    url: "https://chatbot-studio.app/chat/faq-bot-ghi789"
  },
  {
    id: "sess_4",
    chatbotName: "Product Guide",
    userName: "Sarah Wilson",
    userEmail: "sarah@example.com",
    startTime: "2024-06-15 12:00:00",
    endTime: "2024-06-15 12:20:00",
    messageCount: 15,
    status: "completed",
    lastMessage: "Perfect, I found what I was looking for.",
    url: "https://chatbot-studio.app/chat/product-guide-jkl012"
  },
  {
    id: "sess_5",
    chatbotName: "Technical Support",
    userName: "Alex Brown",
    userEmail: "alex@example.com",
    startTime: "2024-06-15 16:45:00",
    endTime: null,
    messageCount: 3,
    status: "active",
    lastMessage: "I'm having trouble with my account",
    url: "https://chatbot-studio.app/chat/tech-support-mno345"
  }
];

const ViewSessions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions] = useState(mockSessions);

  const filteredSessions = sessions.filter(session =>
    session.chatbotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
    ) : (
      <Badge variant="secondary">Completed</Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return "Ongoing";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    return `${duration} min`;
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
              onClick={() => navigate("/")}
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
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">{sessions.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">
                  {sessions.filter(s => s.status === "active").length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">
                  {new Set(sessions.map(s => s.userEmail)).size}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-600" />
                  Chatbots Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">
                  {new Set(sessions.map(s => s.chatbotName)).size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions Table */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Chat Sessions</span>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardTitle>
              <CardDescription>
                Monitor live conversations and analyze chatbot performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chatbot</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Last Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.chatbotName}</div>
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {session.url}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.userName}</div>
                          <div className="text-sm text-gray-500">{session.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(session.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatTime(session.startTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getDuration(session.startTime, session.endTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.messageCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate text-sm text-gray-600">
                          {session.lastMessage}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSessions.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Try adjusting your search terms" : "Sessions will appear here when users start chatting with your bots"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewSessions;
