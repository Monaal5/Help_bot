import { useState, useEffect } from "react";
import { ArrowLeft, Bot, Save, Trash2, Search, Edit3, FileText, Plus, Upload, Download, AlertTriangle } from "lucide-react";
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
import { Chatbot, KnowledgeEntry, Document } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface KnowledgeEntryForm {
  question: string;
  answer: string;
  keywords: string[];
  category?: string;
  subcategory?: string;
  is_duplicate?: boolean;
}

const EditChatbot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntryForm[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<{ category: string; subcategories: string[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Get chatbots for the current user
  const { data: chatbots = [], isLoading } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: () => supabaseChatbotService.getChatbotsByUser(user?.id || ''),
    enabled: !!user?.id,
  });

  // Get knowledge entries for selected chatbot
  const { data: existingKnowledgeEntries = [] } = useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge-entries', selectedChatbot?.id],
    queryFn: () => selectedChatbot ? supabaseChatbotService.getKnowledgeEntries(selectedChatbot.id) : Promise.resolve([]),
    enabled: !!selectedChatbot,
  });

  // Get documents for selected chatbot
  const { data: existingDocs = [] } = useQuery({
    queryKey: ['documents', selectedChatbot?.id],
    queryFn: () => selectedChatbot ? supabaseChatbotService.getDocumentsByChatbot(selectedChatbot.id) : Promise.resolve([]),
    enabled: !!selectedChatbot,
  });

  // Load categories
  useEffect(() => {
    if (selectedChatbot) {
      supabaseChatbotService.getCategories().then(setCategories);
    }
  }, [selectedChatbot]);

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

  // Add knowledge entry mutation
  const addKnowledgeEntryMutation = useMutation({
    mutationFn: (entry: KnowledgeEntryForm) =>
      supabaseChatbotService.addKnowledgeEntry({
        chatbot_id: selectedChatbot!.id,
        question: entry.question,
        answer: entry.answer,
        keywords: entry.keywords,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
      toast({
        title: "Success!",
        description: "Knowledge entry added successfully",
      });
    },
  });

  // Add document mutation
  const addDocumentMutation = useMutation({
    mutationFn: (file: File) =>
      supabaseChatbotService.createDocument({
        chatbot_id: selectedChatbot!.id,
        title: file.name,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        metadata: { uploaded_at: new Date().toISOString() }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success!",
        description: "Document added successfully",
      });
    },
  });

  // Add delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) =>
      supabaseChatbotService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success!",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete document error:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Add delete chatbot mutation
  const deleteChatbotMutation = useMutation({
    mutationFn: (chatbotId: string) => supabaseChatbotService.deleteChatbot(chatbotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      setSelectedChatbot(null);
      toast({
        title: "Success!",
        description: "Chatbot deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete chatbot error:', error);
      toast({
        title: "Error",
        description: "Failed to delete chatbot",
        variant: "destructive",
      });
    },
  });

  // Add toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (chatbotId: string) => supabaseChatbotService.toggleChatbotStatus(chatbotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      toast({
        title: "Success!",
        description: "Chatbot status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Toggle status error:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot status",
        variant: "destructive",
      });
    },
  });

  // Handle bulk import
  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChatbot) return;

    try {
      const text = await file.text();
      const entries = JSON.parse(text);
      const results = await supabaseChatbotService.bulkImport(entries, selectedChatbot.id);
      
      const duplicates = results.filter(r => r.is_duplicate);
      if (duplicates.length > 0) {
        toast({
          title: "Import completed with duplicates",
          description: `${duplicates.length} entries were marked as duplicates.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Import successful",
          description: "All entries were imported successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import entries. Please check the file format.",
        variant: "destructive"
      });
    }
  };

  // Handle bulk export
  const handleBulkExport = async () => {
    if (!selectedChatbot) return;

    try {
      const entries = await supabaseChatbotService.exportEntries(selectedChatbot.id, selectedCategory, showDuplicates);
      const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-base-${selectedChatbot.name}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export entries.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChatbot = (chatbotId: string) => {
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      deleteChatbotMutation.mutate(chatbotId);
    }
  };

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

  const handleUpdateChatbot = (field: keyof Chatbot, value: string) => {
    setSelectedChatbot(prev => 
      prev ? { ...prev, [field]: value } : null
    );
    setIsEditing(true);
  };

  const addKnowledgeEntry = () => {
    setKnowledgeEntries(prev => [...prev, { question: "", answer: "", keywords: [], category: "", subcategory: "" }]);
  };

  const removeKnowledgeEntry = (index: number) => {
    setKnowledgeEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateKnowledgeEntry = (index: number, field: keyof KnowledgeEntryForm, value: string | string[]) => {
    setKnowledgeEntries(prev => prev.map((entry, i) => 
      i === index ? { 
        ...entry, 
        [field]: value,
        category: field === 'category' ? (value === 'none' ? '' : value as string) : entry.category,
        subcategory: field === 'subcategory' ? (value === 'none' ? '' : value as string) : entry.subcategory
      } : entry
    ));
  };

  const handleKeywordsChange = (index: number, keywords: string) => {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
    updateKnowledgeEntry(index, 'keywords', keywordArray);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
    files.forEach(file => addDocumentMutation.mutate(file));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveKnowledgeEntry = async (entry: KnowledgeEntryForm) => {
    if (!selectedChatbot) return;
    await addKnowledgeEntryMutation.mutate(entry);
  };

  const toggleStatus = (chatbotId: string) => {
    toggleStatusMutation.mutate(chatbotId);
  };

  // Add delete document handler
  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedChatbot) return;
    await deleteDocumentMutation.mutate(documentId);
  };

  const filteredEntries = existingKnowledgeEntries.filter(entry => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || entry.subcategory === selectedSubcategory;
    return matchesCategory && matchesSubcategory;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="fzlex items-center"
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
                  <CardTitle>Edit Chatbot</CardTitle>
                  <CardDescription>
                    Modify your chatbot's settings and configuration
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editName">Chatbot Name</Label>
                        <Input
                          id="editName"
                          value={selectedChatbot.name}
                          onChange={(e) => handleUpdateChatbot('name', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editDescription">Description</Label>
                        <Input
                          id="editDescription"
                          value={selectedChatbot.description || ''}
                          onChange={(e) => handleUpdateChatbot('description', e.target.value)}
                          className="w-full"
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

                      <div className="space-y-2">
                        <Label>Give your information to change the chatbot. Just add you and your to make the response valid.</Label>
                        <Textarea
                          placeholder="Give your information to change the chatbot. Just add you and your to make the response valid."
                          value={selectedChatbot.system_prompt || ''}
                          onChange={(e) => handleUpdateChatbot('system_prompt', e.target.value)}
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

                      {/* Existing Knowledge Entries */}
                      {existingKnowledgeEntries.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Existing Entries</h4>
                          {filteredEntries.map((entry: KnowledgeEntry) => (
                            <Card key={entry.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <Label>Knowledge Entry</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement delete functionality
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label>Question</Label>
                                  <Input
                                    value={entry.question}
                                    readOnly
                                    className="bg-gray-50"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Answer</Label>
                                  <Textarea
                                    value={entry.answer}
                                    readOnly
                                    rows={3}
                                    className="bg-gray-50"
                                  />
                                </div>
                                {entry.keywords && entry.keywords.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Keywords</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {entry.keywords.map((keyword: string, i: number) => (
                                        <Badge key={i} variant="secondary">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* New Knowledge Entries */}
                      <div className="space-y-4">
                        {knowledgeEntries.map((entry, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <Label>New Knowledge Entry #{index + 1}</Label>
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
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select 
                                  value={entry.category || ''} 
                                  onValueChange={(value) => updateKnowledgeEntry(index, 'category', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Category</SelectItem>
                                    {categories.map(cat => (
                                      <SelectItem key={cat.category} value={cat.category}>
                                        {cat.category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Subcategory</Label>
                                <Select 
                                  value={entry.subcategory || ''} 
                                  onValueChange={(value) => updateKnowledgeEntry(index, 'subcategory', value)}
                                  disabled={!entry.category}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select subcategory" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Subcategory</SelectItem>
                                    {categories
                                      .find(cat => cat.category === entry.category)
                                      ?.subcategories.map(sub => (
                                        <SelectItem key={sub} value={sub}>
                                          {sub}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                onClick={() => handleSaveKnowledgeEntry(entry)}
                                disabled={!entry.question.trim() || !entry.answer.trim()}
                                className="w-full"
                              >
                                Save Entry
                              </Button>
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

                      {/* Existing Documents */}
                      {existingDocs.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Existing Documents</h4>
                          <div className="space-y-2">
                            {existingDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{doc.title}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  disabled={deleteDocumentMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document Upload */}
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

                      {/* New Documents */}
                      {documents.length > 0 && (
                        <div className="space-y-2">
                          <Label>New Documents</Label>
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

                  {isEditing && (
                    <div className="flex gap-4 pt-4 border-t mt-4">
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

        {/* Knowledge Base Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Knowledge Base</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDuplicates(!showDuplicates)}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {showDuplicates ? 'Hide Duplicates' : 'Show Duplicates'}
              </Button>
              <Button variant="outline" onClick={handleBulkExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBulkImport}
                  className="hidden"
                  id="bulk-import"
                />
                <Button variant="outline" onClick={() => document.getElementById('bulk-import')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedSubcategory} 
              onValueChange={setSelectedSubcategory}
              disabled={!selectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {categories
                  .find(cat => cat.category === selectedCategory)
                  ?.subcategories.map(sub => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {knowledgeEntries.map((entry, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              {entry.is_duplicate && (
                <Alert variant="destructive" className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This entry is similar to existing entries
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select 
                    value={entry.category || ''} 
                    onValueChange={(value) => updateKnowledgeEntry(index, 'category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategory</label>
                  <Select 
                    value={entry.subcategory || ''} 
                    onValueChange={(value) => updateKnowledgeEntry(index, 'subcategory', value)}
                    disabled={!entry.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Subcategory</SelectItem>
                      {categories
                        .find(cat => cat.category === entry.category)
                        ?.subcategories.map(sub => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* ... existing entry fields ... */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditChatbot;
