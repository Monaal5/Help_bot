import { Link } from "react-router-dom";
import { Bot, MessageSquare, Settings, ExternalLink, Plus, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getChatbots } from "@/services/supabaseChatbotService";

const Index = () => {
  const { user } = useUser();
  
  const { data: chatbots, isLoading } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: () => getChatbots(user?.id || ''),
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Chatbot Platform</h1>
              <p className="text-gray-600">Create and manage your AI-powered chatbots</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/create-chatbot">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6 text-center">
                <Bot className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Create New Chatbot</h3>
                <p className="opacity-90">Build your AI assistant with custom knowledge</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/view-sessions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-2">View Chat Sessions</h3>
                <p className="text-gray-600">Monitor conversations and analytics</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/edit-chatbot">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                <h3 className="text-xl font-semibold mb-2">Edit Chatbots</h3>
                <p className="text-gray-600">Customize and update your bots</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Chatbots</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : chatbots && chatbots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatbots.map((chatbot) => (
                <Card key={chatbot.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{chatbot.name}</h3>
                          <p className="text-sm text-gray-500">
                            {chatbot.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {chatbot.description || 'No description available'}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/chat/${chatbot.id}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/edit-chatbot?id=${chatbot.id}`}>
                          <Settings className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No chatbots yet</h3>
                <p className="text-gray-600 mb-6">Create your first AI chatbot to get started</p>
                <Link to="/create-chatbot">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chatbot
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
