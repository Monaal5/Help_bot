import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { HeroSection } from "@/components/ui/hero-section";
import { supabaseChatbotService } from "@/services/supabaseChatbotService";

export default function Landing() {
  const { user, isLoaded } = useUser();

  // Get user's chatbots to determine if they're an admin or viewer
  const { data: userChatbots, isLoading: chatbotsLoading } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: () => supabaseChatbotService.getChatbotsByUser(user?.id || ''),
    enabled: !!user?.id && isLoaded,
  });

  // Check if user has viewer permissions
  const { data: viewerChatbots, isLoading: viewerLoading } = useQuery({
    queryKey: ['viewer-chatbots', user?.emailAddresses?.[0]?.emailAddress],
    queryFn: () => supabaseChatbotService.getViewerAccessibleChatbots(user?.emailAddresses?.[0]?.emailAddress || ''),
    enabled: !!user?.emailAddresses?.[0]?.emailAddress && isLoaded,
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

  const isAdmin = userChatbots && userChatbots.length > 0;
  const isViewer = !isAdmin && viewerChatbots && viewerChatbots.length > 0;

  // Redirect viewers directly to sessions page
  if (isViewer) {
    return <Navigate to="/view-sessions" replace />;
  }

  // Redirect admins to dashboard
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <HeroSection
      badge={{
        text: "Welcome to MedCare",
        action: {
          text: "Learn more",
          href: "/about",
        },
      }}
      title="Build, Manage, and Chat with AI"
      description="Create your own chatbots, upload knowledge, and chat with AI. Get started now!"
      actions={[
        {
          text: "Get Started",
          href: "/dashboard",
          variant: "default",
        },
      ]}
      image={{
        light: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        dark: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
        alt: "Chatbot Hub Preview",
      }}
    />
  );
}