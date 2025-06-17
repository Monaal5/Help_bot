import { useState } from "react";
import { ArrowLeft, Bot, Copy, FileText, Upload, Globe, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { initializeChatbotKnowledge } from "@/services/chatbotService";

const CreateChatbot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatbotName, setChatbotName] = useState("");
  const [textData, setTextData] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const generateChatbotUrl = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${window.location.origin}/chat/${slug}-${randomId}`;
  };

  const handleCreateChatbot = async () => {
    if (!chatbotName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chatbot name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    // Initialize the knowledge base with provided data
    initializeChatbotKnowledge(textData, files);
    
    // Simulate chatbot creation
    setTimeout(() => {
      const url = generateChatbotUrl(chatbotName);
      setGeneratedUrl(url);
      setIsCreated(true);
      setIsCreating(false);
      
      toast({
        title: "Success!",
        description: "Your chatbot has been created with custom knowledge base",
      });
    }, 3000); // Increased time to show knowledge processing
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
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
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Chatbot
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!isCreated ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chatbot Configuration */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Chatbot Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up your chatbot's basic information and knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Chatbot Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter chatbot name..."
                      value={chatbotName}
                      onChange={(e) => setChatbotName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textData">Knowledge Base (Text)</Label>
                    <Textarea
                      id="textData"
                      placeholder="Enter text data, instructions, or knowledge for your chatbot..."
                      value={textData}
                      onChange={(e) => setTextData(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      Add custom knowledge that your chatbot will use to answer questions
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateChatbot}
                    disabled={isCreating}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isCreating ? "Creating & Processing Knowledge..." : "Create Chatbot"}
                  </Button>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Documents
                  </CardTitle>
                  <CardDescription>
                    Upload PDF files, documents, or other files to train your chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="files">Upload Files</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        id="files"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="files" className="cursor-pointer">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, DOC, DOCX, TXT files
                        </p>
                      </label>
                    </div>
                  </div>

                  {files && files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Selected Files:</h4>
                      <div className="space-y-1">
                        {Array.from(files).map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">How it works:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Upload documents to create a custom knowledge base</li>
                      <li>• Chatbot will prioritize your content for answers</li>
                      <li>• Falls back to AI for questions outside your data</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Success State */
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Chatbot Created Successfully!</CardTitle>
                <CardDescription>
                  Your intelligent chatbot "{chatbotName}" is ready with custom knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Shareable URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedUrl}
                      readOnly
                      className="bg-gray-50 font-mono text-sm"
                    />
                    <Button
                      onClick={copyUrlToClipboard}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Your chatbot will answer from your knowledge base first, then use AI for other questions
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => window.open(generatedUrl, '_blank')}
                    className="flex-1"
                    variant="outline"
                  >
                    Test Chatbot
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateChatbot;
