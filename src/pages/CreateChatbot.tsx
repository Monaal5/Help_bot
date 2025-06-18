import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChatbot, addKnowledgeEntry, uploadDocument } from "@/services/supabaseChatbotService";

const CreateChatbot = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant."
  );
  const [textData, setTextData] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const createChatbotMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      systemPrompt: string;
      textData: string;
      files: FileList | null;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Create chatbot
      const chatbot = await createChatbot(
        data.name,
        data.description,
        data.systemPrompt,
        user.id
      );

      // Add text data as knowledge if provided
      if (data.textData.trim()) {
        await addKnowledgeEntry(
          chatbot.id,
          `General Knowledge`,
          data.textData,
          ['general', 'text-data']
        );
      }

      // Process uploaded files
      if (data.files && data.files.length > 0) {
        for (const file of Array.from(data.files)) {
          // For demo purposes, we'll just add the filename as knowledge
          // In a real app, you'd extract text content from PDFs
          await uploadDocument(
            chatbot.id,
            file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            `This document contains information about ${file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}`,
            file.name,
            file.type
          );
        }
      }

      return chatbot;
    },
    onSuccess: (chatbot) => {
      toast({
        title: "Success!",
        description: `Chatbot "${chatbot.name}" created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create chatbot",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chatbot name",
        variant: "destructive",
      });
      return;
    }

    createChatbotMutation.mutate({
      name,
      description,
      systemPrompt,
      textData,
      files,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Your AI Chatbot
        </h1>
        <p className="text-gray-600">
          Customize your chatbot's name, description, and behavior. Add
          knowledge by uploading files or entering text data.
        </p>
      </header>
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              Create New AI Chatbot
            </CardTitle>
            <CardDescription>
              Build your custom AI assistant with personalized knowledge and behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Chatbot Name</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter chatbot name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a brief description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Define the chatbot's behavior"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="textData">
                  Additional Knowledge (Text Data)
                </Label>
                <Textarea
                  id="textData"
                  placeholder="Enter any additional knowledge for the chatbot"
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="files">Upload Files (PDF, TXT, etc.)</Label>
                <Input
                  type="file"
                  id="files"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createChatbotMutation.isPending}
                >
                  {createChatbotMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Chatbot
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateChatbot;
