import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToMonitoring(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900">
                  Something went wrong
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Error details (development only)
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={this.handleReset}
                    size="sm"
                    variant="outline"
                  >
                    Try again
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    size="sm"
                    variant="outline"
                  >
                    Reload page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for mindmap
export function MindmapErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load mindmap
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              There was an error loading the mindmap visualization.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reload page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}