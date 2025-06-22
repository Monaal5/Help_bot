import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ErrorBoundary} from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Landing from "./pages/Landing";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const CreateChatbot = lazy(() => import("./pages/CreateChatbot"));
const ViewSessions = lazy(() => import("./pages/ViewSessions"));
const EditChatbot = lazy(() => import("./pages/EditChatbot"));
const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Components
import { AuthGuard } from "./components/AuthGuard";

// Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Use the provided Clerk publishable key directly as requested
const PUBLISHABLE_KEY = "pk_test_c3RpbGwtbXVza294LTYwLmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please check your environment variables.");
}

const App = () => (
  <ErrorBoundary>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<AuthGuard><Landing /></AuthGuard>} />
                <Route path="/dashboard" element={<AuthGuard><Index /></AuthGuard>} />
                <Route path="/create-chatbot" element={<AuthGuard><CreateChatbot /></AuthGuard>} />
                <Route path="/view-sessions" element={<AuthGuard><ViewSessions /></AuthGuard>} />
                <Route path="/edit-chatbot" element={<AuthGuard><EditChatbot /></AuthGuard>} />
                <Route path="/chat/:chatbotId" element={<ChatbotPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </ErrorBoundary>
);

export default App;
