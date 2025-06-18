
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import Index from "./pages/Index";
import CreateChatbot from "./pages/CreateChatbot";
import ViewSessions from "./pages/ViewSessions";
import EditChatbot from "./pages/EditChatbot";
import ChatbotPage from "./pages/ChatbotPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const PUBLISHABLE_KEY = "pk_test_YWRhcHRpbmctY2F0LTIuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
            <Route path="/create-chatbot" element={<AuthGuard><CreateChatbot /></AuthGuard>} />
            <Route path="/view-sessions" element={<AuthGuard><ViewSessions /></AuthGuard>} />
            <Route path="/edit-chatbot" element={<AuthGuard><EditChatbot /></AuthGuard>} />
            <Route path="/chat/:chatbotId" element={<ChatbotPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
