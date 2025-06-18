
import { useUser } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
