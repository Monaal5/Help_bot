import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 