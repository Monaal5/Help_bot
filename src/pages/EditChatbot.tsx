
import { useState, useEffect } from "react";
import { ArrowLeft, Bot, Save, Trash2, Search, Edit3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";
import { Chatbot } from "@/types/database";

const EditChatbot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Get chatbots for the current user
  const { data: chatbots = [], isLoading } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: () => supabaseChatbotService.getChatbotsByUser(user?.id || ''),
    enabled: !!user?.id,
  });

  // Update chatbot mutation
  const updateChatbotMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Chatbot> }) =>
      supabaseChatbotService.updateChatbot(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      setIsEditing(false);
      toast({
        title: "Success!",
        description: "Chatbot updated successfully",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot",
        variant: "destructive",
      });
    },
  });

  const filteredChatbots = chatbots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectChatbot = (chatbot: Chatbot) => {
    setSelectedChatbot({ ...chatbot });
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedChatbot) return;

    updateChatbotMutation.mutate({
      id: selectedChatbot.id,
      updates: {
        name: selectedChatbot.name,
        description: selectedChatbot.description,
        system_prompt: selectedChatbot.system_prompt,
      }
    });
  };

  const handleDeleteChatbot = async (chatbotId: string) => {
    try {
      await supabaseChatbotService.updateChatbot(chatbotId, { is_active: false });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      
      if (selectedChatbot?.id === chatbotId) {
        setSelectedChatbot(null);
        setIsEditing(false);
      }
      
      toast({
        title: "Deleted",
        description: "Chatbot deleted successfully",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete chatbot",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (chatbotId: string) => {
    const chatbot = chatbots.find(bot => bot.id === chatbotId);
    if (!chatbot) return;

    try {
      await supabaseChatbotService.updateChatbot(chatbotId, { 
        is_active: !chatbot.is_active 
      });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      
      if (selectedChatbot?.id === chatbotId) {
        setSelectedChatbot(prev => 
          prev ? { ...prev, is_active: !prev.is_active } : null
        );
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading chatbots...</p>
        </div>
      </div>
    );
  }

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
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <Edit3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Edit Chatbots
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chatbot List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Your Chatbots
                </CardTitle>
                <CardDescription>
                  Select a chatbot to edit its configuration
                </CardDescription>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search chatbots..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredChatbots.map((chatbot) => (
                  <div
                    key={chatbot.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedChatbot?.id === chatbot.id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleSelectChatbot(chatbot)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{chatbot.name}</h3>
                      <Badge variant={chatbot.is_active ? "default" : "secondary"}>
                        {chatbot.is_active ? "active" : "inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(chatbot.created_at || '').toLocaleDateString()}
                    </p>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(chatbot.id);
                        }}
                        className="text-xs px-2 py-1 h-6"
                      >
                        {chatbot.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChatbot(chatbot.id);
                        }}
                        className="text-xs px-2 py-1 h-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredChatbots.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No chatbots found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Panel */}
          <div className="lg:col-span-2">
            {selectedChatbot ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5" />
                        Edit Chatbot
                      </CardTitle>
                      <CardDescription>
                        Modify your chatbot's configuration and behavior
                      </CardDescription>
                    </div>
                    <Badge variant={selectedChatbot.is_active ? "default" : "secondary"}>
                      {selectedChatbot.is_active ? "active" : "inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Chatbot Name</Label>
                    <Input
                      id="editName"
                      value={selectedChatbot.name}
                      onChange={(e) => {
                        setSelectedChatbot(prev => 
                          prev ? { ...prev, name: e.target.value } : null
                        );
                        setIsEditing(true);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description</Label>
                    <Input
                      id="editDescription"
                      value={selectedChatbot.description || ''}
                      onChange={(e) => {
                        setSelectedChatbot(prev => 
                          prev ? { ...prev, description: e.target.value } : null
                        );
                        setIsEditing(true);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editSystemPrompt">System Prompt</Label>
                    <Textarea
                      id="editSystemPrompt"
                      value={selectedChatbot.system_prompt || ''}
                      onChange={(e) => {
                        setSelectedChatbot(prev => 
                          prev ? { ...prev, system_prompt: e.target.value } : null
                        );
                        setIsEditing(true);
                      }}
                      className="min-h-[100px] resize-none"
                      placeholder="Define how your chatbot should behave..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chatbot URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/chat/${selectedChatbot.id}`}
                        readOnly
                        className="bg-gray-50 font-mono text-sm"
                      />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/chat/${selectedChatbot.id}`);
                          toast({
                            title: "Copied!",
                            description: "URL copied to clipboard",
                          });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      OpenRouter API Configuration
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Configure your OpenRouter API key to enable AI responses
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">OpenRouter API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your OpenRouter API key..."
                        onChange={(e) => {
                          localStorage.setItem('openrouter_api_key', e.target.value);
                        }}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Get your API key from <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-600 hover:underline">OpenRouter</a>
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 pt-4 border-t">
                      <Button
                        onClick={handleSaveChanges}
                        disabled={updateChatbotMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateChatbotMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={() => {
                          const originalChatbot = chatbots.find(bot => bot.id === selectedChatbot.id);
                          if (originalChatbot) {
                            setSelectedChatbot(originalChatbot);
                          }
                          setIsEditing(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Edit3 className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Select a Chatbot to Edit
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Choose a chatbot from the list on the left to view and modify its configuration.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditChatbot;
