import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";
import { DocumentProcessor } from "@/services/documentProcessor";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { Plus, Trash2, Upload, Bot, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface KnowledgeEntry {
  question: string;
  answer: string;
  keywords: string[];
}

export default function CreateChatbot() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [processingDocuments, setProcessingDocuments] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
  });
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([
    { question: "", answer: "", keywords: [] }
  ]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clerkUser) {
      toast({
        variant: "destructive",
        description: "You must be logged in to create a chatbot."
      });
      return;
    }

    setIsLoading(true);
    try {
      const chatbot = await supabaseChatbotService.createChatbot({
        name: formData.name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        clerk_user_id: clerkUser.id
      });

      setChatbotId(chatbot.id);

      // Add knowledge entries
      for (const entry of knowledgeEntries) {
        if (entry.question.trim() && entry.answer.trim()) {
          await supabaseChatbotService.addKnowledgeEntry({
            chatbot_id: chatbot.id,
            question: entry.question,
            answer: entry.answer,
            keywords: entry.keywords
          });
        }
      }

      toast({
        description: "Chatbot created successfully!"
      });
      
      // Navigate to dashboard page instead of home page
      navigate('/dashboard');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setDocuments(prev => [...prev, ...files]);
    setIsLoading(true);

    try {
      if (!clerkUser?.id) {
        throw new Error('User must be authenticated to upload files');
      }

      // Only process files if we already have a chatbot ID
      if (!chatbotId) {
        toast({
          variant: "destructive",
          description: "Please create the chatbot first before uploading files."
        });
        setDocuments(prev => prev.filter(doc => !files.includes(doc)));
        return;
      }

      // Process each file
      for (const file of files) {
        setProcessingDocuments(prev => ({ ...prev, [file.name]: true }));
        try {
          const processedDoc = await DocumentProcessor.processDocument(file, chatbotId);
          
          // Store the document in Supabase
          await supabaseChatbotService.createDocument({
            chatbot_id: chatbotId,
            title: file.name,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            content: processedDoc.content,
            metadata: {
              ...processedDoc.metadata,
              uploaded_at: new Date().toISOString()
            }
          });

          toast({
            title: "Success!",
            description: `Successfully processed ${file.name}`,
          });
        } catch (error) {
          console.error('Error processing document:', error);
          toast({
            title: "Error",
            description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        } finally {
          setProcessingDocuments(prev => ({ ...prev, [file.name]: false }));
        }
      }
    } catch (error) {
      console.error('Error in file upload:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process files',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Create New Chatbot</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Chatbot Name</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="systemPrompt">Give your information to change the chatbot. Just add you and your to make the response valid.</Label>
                    <Textarea
                      id="systemPrompt"
                      placeholder="Give your information to change the chatbot. Just add you and your to make the response valid."
                      value={formData.system_prompt}
                      onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                      rows={8}
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
                    <p className="text-sm text-gray-600 mb-2">Upload PDF or DOCX files</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Select Files
                    </label>
                  </div>

                  {documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {documents.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">{file.name}</span>
                          <div className="flex items-center space-x-2">
                            {processingDocuments[file.name] && (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Creating...
                    </>
                  ) : (
                    'Create Chatbot'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
