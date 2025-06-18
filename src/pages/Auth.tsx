
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Sign up to create your AI chatbots" 
                : "Sign in to manage your chatbots"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSignUp ? (
              <SignUp 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                    card: "shadow-none",
                  }
                }}
                redirectUrl="/"
              />
            ) : (
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                    card: "shadow-none",
                  }
                }}
                redirectUrl="/"
              />
            )}
            
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
