import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";

const ViewerInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const { user, isLoaded, isSignedIn } = useUser();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Get invitation details by token
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['viewer-invitation', token],
    queryFn: () => token ? supabaseChatbotService.getViewerPermissionByToken(token) : Promise.resolve(null),
    enabled: !!token,
    retry: false,
  });

  // Check if user is already signed in with the correct email
  useEffect(() => {
    if (isLoaded && isSignedIn && user && invitation) {
      const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      const invitationEmail = invitation.viewer_email.toLowerCase();
      
      if (userEmail === invitationEmail) {
        // Redirect to sessions page after a short delay
        setTimeout(() => setShouldRedirect(true), 2000);
      }
    }
  }, [isLoaded, isSignedIn, user, invitation]);

  if (shouldRedirect) {
    return <Navigate to="/view-sessions" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              This invitation link is invalid, expired, or has already been used.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Possible reasons:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The link has expired (invitations are valid for 7 days)</li>
                <li>The invitation has been revoked</li>
                <li>The link is malformed</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Please contact the person who sent you this invitation for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.token_expires_at || '') < new Date();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const invitationEmail = invitation.viewer_email.toLowerCase();
  const isCorrectUser = userEmail === invitationEmail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-blue-800">Viewer Invitation</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Chatbot:</span>
              <span className="text-sm text-gray-900">{(invitation as any).chatbots?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Invited Email:</span>
              <span className="text-sm text-gray-900">{invitation.viewer_email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <Badge variant={isExpired ? "destructive" : "default"}>
                {isExpired ? "Expired" : "Active"}
              </Badge>
            </div>
            {invitation.token_expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Expires:</span>
                <span className="text-sm text-gray-900 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(invitation.token_expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Invitation Expired</span>
              </div>
              <p className="text-red-700 text-sm mt-2">
                This invitation has expired. Please contact the administrator for a new invitation.
              </p>
            </div>
          ) : !isSignedIn ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Mail className="w-5 h-5" />
                <span className="font-medium">Sign In Required</span>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                Please sign in with the email address <strong>{invitation.viewer_email}</strong> to access the sessions.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          ) : !isCorrectUser ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Wrong Account</span>
              </div>
              <p className="text-yellow-700 text-sm mb-2">
                You're signed in as <strong>{userEmail}</strong>, but this invitation is for <strong>{invitation.viewer_email}</strong>.
              </p>
              <p className="text-yellow-700 text-sm mb-3">
                Please sign in with the correct email address or contact the administrator.
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Sign In with Different Account
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Access Granted!</span>
              </div>
              <p className="text-green-700 text-sm mb-3">
                You have viewer access to this chatbot's sessions. You'll be redirected automatically.
              </p>
              <Button 
                onClick={() => setShouldRedirect(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Sessions Now
              </Button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>As a viewer, you can monitor chat sessions but cannot make changes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewerInvitation;
