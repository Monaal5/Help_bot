import React, { useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, Plus, Trash2, Mail, Bot, Users, Send, Copy, ExternalLink } from "lucide-react";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";
import { ViewerPermission, Chatbot } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { emailService } from "@/services/emailService";

interface ManageViewersProps {
  chatbots: Chatbot[];
}

const ManageViewers: React.FC<ManageViewersProps> = ({ chatbots }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChatbot, setSelectedChatbot] = useState<string>('');
  const [newViewerEmail, setNewViewerEmail] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Get viewer permissions for selected chatbot
  const { data: viewerPermissions = [], isLoading, error: viewerPermissionsError } = useQuery({
    queryKey: ['viewer-permissions', selectedChatbot, user?.id],
    queryFn: () => selectedChatbot && user?.id ? supabaseChatbotService.getViewerPermissions(selectedChatbot, user.id) : Promise.resolve([]),
    enabled: !!selectedChatbot && !!user?.id,
    retry: false, // Don't retry on 404 errors
  });

  // Add viewer mutation
  const addViewerMutation = useMutation({
    mutationFn: async ({ chatbotId, email }: { chatbotId: string; email: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return supabaseChatbotService.createViewerPermission(chatbotId, email, user.id);
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['viewer-permissions'] });

      // Find the chatbot name for the email
      const chatbot = chatbots.find(c => c.id === variables.chatbotId);
      const chatbotName = chatbot?.name || 'Unknown Chatbot';

      // Show success message with options
      setNewViewerEmail('');
      setIsAddDialogOpen(false);

      // Show success toast with action buttons
      toast({
        title: "Viewer Added Successfully!",
        description: (
          <div className="space-y-3">
            <p>Viewer access granted to {variables.email}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendInvitation(variables.email, chatbotName, data, false)}
                className="text-xs"
                title="Open default mail client"
              >
                <Send className="w-3 h-3 mr-1" />
                Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendInvitation(variables.email, chatbotName, data, true)}
                className="text-xs"
                title="Compose in Gmail"
              >
                <Send className="w-3 h-3 mr-1" />
                Gmail
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyInvitation(variables.email, chatbotName, data)}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Link
              </Button>
            </div>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
    },
    onError: (error: any) => {
      console.error('Add viewer error:', error);
      let errorMessage = "Failed to add viewer access.";

      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        errorMessage = "Database migration required. Please apply the viewer permissions migration first. Check the apply-viewer-permissions-migration.md file for instructions.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    },
  });

  // Revoke viewer mutation
  const revokeViewerMutation = useMutation({
    mutationFn: (permissionId: string) => supabaseChatbotService.revokeViewerPermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewer-permissions'] });
      toast({
        title: "Access Revoked",
        description: "Viewer access has been revoked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to revoke viewer access.",
      });
    },
  });

  const handleAddViewer = () => {
    if (!selectedChatbot || !newViewerEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a chatbot and enter a valid email address.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newViewerEmail.trim())) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address.",
      });
      return;
    }

    addViewerMutation.mutate({
      chatbotId: selectedChatbot,
      email: newViewerEmail.trim().toLowerCase(),
    });
  };

  const handleRevokeViewer = (permissionId: string) => {
    revokeViewerMutation.mutate(permissionId);
  };

  const handleSendInvitation = async (viewerEmail: string, chatbotName: string, permission?: ViewerPermission, preferGmail?: boolean) => {
    try {
      const applicationUrl = window.location.origin;
      const success = await emailService.sendViewerInvitation({
        viewerEmail,
        chatbotName,
        adminName: user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Admin',
        adminEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        applicationUrl,
        invitationToken: permission?.invitation_token,
      }, { preferGmail });

      if (success) {
        toast({
          title: preferGmail ? "Gmail Compose Opened" : "Email Client Opened",
          description: preferGmail
            ? "Gmail compose opened with the invitation message."
            : "Your default email client opened with the invitation message.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open email client.",
      });
    }
  };

  const handleCopyInvitation = async (viewerEmail: string, chatbotName: string, permission?: ViewerPermission) => {
    try {
      const applicationUrl = window.location.origin;
      const success = await emailService.copyInvitationToClipboard({
        viewerEmail,
        chatbotName,
        adminName: user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Admin',
        adminEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        applicationUrl,
        invitationToken: permission?.invitation_token,
      });

      if (success) {
        toast({
          title: "Copied to Clipboard",
          description: "Invitation message with direct access link copied. You can paste it in any messaging app.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard.",
      });
    }
  };

  if (chatbots.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Chatbots Available</h3>
          <p className="text-gray-600">Create a chatbot first to manage viewer access.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Manage Viewers
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Grant specific email addresses access to view chat sessions for your chatbots.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">How viewers access the system:</p>
                <ol className="text-blue-700 space-y-1 text-xs">
                  <li>1. <strong>Best:</strong> Use the direct invitation link (includes unique token)</li>
                  <li>2. <strong>Alternative:</strong> Visit <code className="bg-blue-100 px-1 rounded">{window.location.origin}</code> and sign in</li>
                  <li>3. They must sign in with the exact email address you specify</li>
                  <li>4. They're automatically redirected to view sessions</li>
                </ol>
                <p className="text-blue-600 text-xs mt-2">
                  💡 Use the <Send className="w-3 h-3 inline" /> email or <Copy className="w-3 h-3 inline" /> copy buttons to send invitation links!
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chatbot Selection */}
        <div className="space-y-2">
          <Label htmlFor="chatbot-select">Select Chatbot</Label>
          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a chatbot to manage viewers" />
            </SelectTrigger>
            <SelectContent>
              {chatbots.map((chatbot) => (
                <SelectItem key={chatbot.id} value={chatbot.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    {chatbot.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedChatbot && (
          <>
            {/* Migration Required Notice */}
            {viewerPermissionsError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <h4 className="font-medium text-yellow-800">Migration Required</h4>
                </div>
                <p className="text-sm text-yellow-700 mb-2">
                  The viewer permissions feature requires a database migration to be applied.
                </p>
                <p className="text-xs text-yellow-600">
                  Please check the <code className="bg-yellow-100 px-1 rounded">apply-viewer-permissions-migration.md</code> file for instructions.
                </p>
              </div>
            )}

            {/* Add Viewer Button */}
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Current Viewers</h4>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Viewer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Viewer Access</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="viewer-email">Email Address</Label>
                      <Input
                        id="viewer-email"
                        type="email"
                        placeholder="viewer@example.com"
                        value={newViewerEmail}
                        onChange={(e) => setNewViewerEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddViewer}
                        disabled={addViewerMutation.isPending}
                      >
                        {addViewerMutation.isPending ? 'Adding...' : 'Add Viewer'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Viewers List */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : viewerPermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No viewers added yet</p>
                  <p className="text-sm">Add viewer access to allow others to view sessions.</p>
                </div>
              ) : (
                viewerPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">{permission.viewer_email}</p>
                        <p className="text-xs text-gray-500">
                          Added {format(new Date(permission.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={permission.is_active ? "default" : "secondary"}>
                        {permission.is_active ? "Active" : "Revoked"}
                      </Badge>
                      {permission.is_active && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const chatbot = chatbots.find(c => c.id === selectedChatbot);
                              handleSendInvitation(permission.viewer_email, chatbot?.name || 'Unknown', permission);
                            }}
                            title="Send invitation email"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const chatbot = chatbots.find(c => c.id === selectedChatbot);
                              handleCopyInvitation(permission.viewer_email, chatbot?.name || 'Unknown', permission);
                            }}
                            title="Copy invitation message"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeViewer(permission.id)}
                            disabled={revokeViewerMutation.isPending}
                            title="Revoke access"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageViewers;
