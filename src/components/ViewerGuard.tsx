import { useUser } from "@clerk/clerk-react";
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";

interface ViewerGuardProps {
  children: ReactNode;
  allowViewerAccess?: boolean; // If true, allows viewers to access this route
}

export const ViewerGuard = ({ children, allowViewerAccess = false }: ViewerGuardProps) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();

  // Get user's chatbots to determine if they're an admin or viewer
  const { data: userChatbots, isLoading: chatbotsLoading } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: () => supabaseChatbotService.getChatbotsByUser(user?.id || ''),
    enabled: !!user?.id && isSignedIn,
  });

  // Check if user has viewer permissions
  const { data: viewerChatbots, isLoading: viewerLoading } = useQuery({
    queryKey: ['viewer-chatbots', user?.emailAddresses?.[0]?.emailAddress],
    queryFn: () => supabaseChatbotService.getViewerAccessibleChatbots(user?.emailAddresses?.[0]?.emailAddress || ''),
    enabled: !!user?.emailAddresses?.[0]?.emailAddress && isSignedIn,
  });

  if (!isLoaded || chatbotsLoading || viewerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  // Check Clerk metadata for admin role
  const clerkIsAdmin = user?.publicMetadata?.role === "admin";
  const isAdmin = clerkIsAdmin || (userChatbots && userChatbots.length > 0);

  const isViewer = !isAdmin && viewerChatbots && viewerChatbots.length > 0;
  const hasNoAccess = !isAdmin && !isViewer;

  // If user has no access at all, show access denied
  if (hasNoAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this application. Please contact an administrator to request access.
          </p>
          <p className="text-sm text-gray-500">
            Your email: {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
      </div>
    );
  }

  // If user is a viewer
  if (isViewer) {
    // Allow access to viewer-permitted routes
    if (allowViewerAccess) {
      return <>{children}</>;
    }
    
    // Redirect viewers to sessions page if they try to access admin routes
    if (location.pathname !== '/view-sessions') {
      return <Navigate to="/view-sessions" replace />;
    }
  }

  // If user is an admin, allow access to all routes
  if (isAdmin) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
