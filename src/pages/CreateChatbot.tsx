
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";
import { Plus, Trash2, Upload, Bot } from "lucide-react";

interface KnowledgeEntry {
  question: string;
  answer: string;
  keywords: string[];
}

export default function CreateChatbot() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: ""
  });

  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([
    { question: "", answer: "", keywords: [] }
  ]);

  const [documents, setDocuments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        description: "You must be logged in to create a chatbot."
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a name for your chatbot."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the chatbot first
      const chatbot = await supabaseChatbotService.createChatbot({
        name: formData.name,
        description: formData.description,
        system_prompt: formData.systemPrompt,
        clerk_user_id: user.id
      });

      // Add knowledge entries if any are provided
      for (const entry of knowledgeEntries) {
        if (entry.question.trim() && entry.answer.trim()) {
          await supabaseChatbotService.addKnowledgeEntry({
            chatbot_id: chatbot.id,
            question: entry.question,
            answer: entry.answer,
            keywords: entry.keywords.filter(k => k.trim() !== "")
          });
        }
      }

      // Handle document uploads if any
      for (const file of documents) {
        await supabaseChatbotService.createDocument({
          chatbot_id: chatbot.id,
          title: file.name,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          // In a real implementation, you'd upload the file to storage first
          // and get the URL, but for now we'll just store the metadata
          metadata: { uploaded_at: new Date().toISOString() }
        });
      }

      toast({
        description: "Chatbot created successfully!"
      });

      navigate(`/`);
    } catch (error) {
      console.error('Error creating chatbot:', error);
      toast({
        variant: "destructive",
        description: "Failed to create chatbot. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addKnowledgeEntry = () => {
    setKnowledgeEntries(prev => [...prev, { question: "", answer: "", keywords: [] }]);
  };

  const removeKnowledgeEntry = (index: number) => {
    setKnowledgeEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateKnowledgeEntry = (index: number, field: keyof KnowledgeEntry, value: string | string[]) => {
    setKnowledgeEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleKeywordsChange = (index: number, keywords: string) => {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
    updateKnowledgeEntry(index, 'keywords', keywordArray);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Create New Chatbot
                </CardTitle>
                <CardDescription>
                  Set up your AI chatbot with custom knowledge and personality
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Chatbot Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter chatbot name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what your chatbot does"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      placeholder="Define your chatbot's personality and behavior"
                      value={formData.systemPrompt}
                      onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Knowledge Entries</h3>
                      <p className="text-sm text-gray-600">Add question-answer pairs to train your chatbot</p>
                    </div>
                    <Button type="button" onClick={addKnowledgeEntry} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {knowledgeEntries.map((entry, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label>Knowledge Entry #{index + 1}</Label>
                            {knowledgeEntries.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeKnowledgeEntry(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              placeholder="Enter a question"
                              value={entry.question}
                              onChange={(e) => updateKnowledgeEntry(index, 'question', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              placeholder="Enter the answer"
                              value={entry.answer}
                              onChange={(e) => updateKnowledgeEntry(index, 'answer', e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Keywords (comma-separated)</Label>
                            <Input
                              placeholder="keyword1, keyword2, keyword3"
                              value={entry.keywords.join(', ')}
                              onChange={(e) => handleKeywordsChange(index, e.target.value)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Document Training</h3>
                    <p className="text-sm text-gray-600">Upload documents to train your chatbot</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Upload documents (PDF, TXT, DOC)</p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Documents</Label>
                      <div className="space-y-2">
                        {documents.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDocument(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Create Chatbot"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
