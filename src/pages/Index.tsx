import { Bot, MessageSquare, Settings, Plus, Eye, Edit3, Zap, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ChatBot Studio
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="hidden sm:flex">
                <Zap className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <SignedOut>
        {/* Hero Section for Signed Out Users */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                <Globe className="h-3 w-3 mr-1" />
                Share Instantly with Generated URLs
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Create & Deploy
              <br />
              Chatbots Instantly
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Build intelligent chatbots, generate shareable URLs, and track conversations in real-time. 
              Perfect for customer support, lead generation, and user engagement.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border">
                <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium">Real-time Chat</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border">
                <Globe className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium">Instant URLs</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border">
                <Users className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium">Multi-user Access</span>
              </div>
            </div>

            {/* Auth CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Building Now
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="font-semibold px-8 py-4 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </section>
      </SignedOut>

      <SignedIn>
        {/* Main Dashboard for Signed In Users */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to your ChatBot Studio
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create, manage, and deploy intelligent chatbots with shareable URLs.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Create Chatbot Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">Create Chatbot</CardTitle>
                <CardDescription className="text-gray-600">
                  Build a new intelligent chatbot with custom responses and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Bot
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Get a shareable URL instantly
                </p>
              </CardContent>
            </Card>

            {/* View Sessions Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">View Sessions</CardTitle>
                <CardDescription className="text-gray-600">
                  Monitor live conversations and analyze chatbot performance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  View Sessions
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Real-time conversation tracking
                </p>
              </CardContent>
            </Card>

            {/* Edit Chatbot Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Edit3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">Edit Chatbot</CardTitle>
                <CardDescription className="text-gray-600">
                  Customize existing chatbots and update their configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Edit3 className="h-5 w-5 mr-2" />
                  Edit Bot
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Update responses & settings
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </SignedIn>

      {/* Features Section */}
      <section className="bg-white/50 backdrop-blur-sm border-y">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Everything you need to manage chatbots
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools necessary to create, deploy, and manage intelligent chatbots for your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Instant Deployment</h3>
              <p className="text-sm text-gray-600">Get your chatbot live with a shareable URL in seconds</p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time Chat</h3>
              <p className="text-sm text-gray-600">Live conversations with instant message delivery</p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Multi-user Support</h3>
              <p className="text-sm text-gray-600">Multiple users can access the same chatbot simultaneously</p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mx-auto mb-4">
                <Settings className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Easy Management</h3>
              <p className="text-sm text-gray-600">Simple interface to create, edit, and monitor your bots</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show for signed out users */}
      <SignedOut>
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to create your first chatbot?
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands of companies using our platform to engage with their customers through intelligent chatbots.
            </p>
            <SignUpButton mode="modal">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start Building Now
              </Button>
            </SignUpButton>
          </div>
        </section>
      </SignedOut>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">ChatBot Studio</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 ChatBot Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
