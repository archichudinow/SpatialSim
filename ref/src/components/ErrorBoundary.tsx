import React, { ReactNode, ErrorInfo } from 'react';
import type { JSX } from 'react';
import { Html } from '@react-three/drei';
import { useAppState } from '../AppState';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleName: string;
  fallback?: ReactNode;
  inCanvas?: boolean;
  onError?: (errorData: ErrorData) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorData {
  module: string;
  error: string;
  stack: string;
  timestamp: number;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.
 * Integrates with AppState to track errors globally.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store error information
    this.setState({
      error,
      errorInfo
    });

    // Update global error state if available
    if (this.props.onError) {
      this.props.onError({
        module: this.props.moduleName,
        error: error.toString(),
        stack: errorInfo.componentStack || '',
        timestamp: Date.now()
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI - wrapped in Html for Canvas compatibility
      const ErrorUI = () => (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#c92a2a'
        }}>
          <h2>⚠️ Module Error: {this.props.moduleName}</h2>
          <details style={{ marginTop: '10px', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Error Details
            </summary>
            <pre style={{
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              color: '#212529'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reset Module
          </button>
        </div>
      );

      // If inside Canvas (module wrapped in ErrorBoundary inside Canvas), use Html
      if (this.props.inCanvas) {
        return (
          <Html center>
            <ErrorUI />
          </Html>
        );
      }

      // Otherwise render normally
      return <ErrorUI />;
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper
 * Use this to wrap functional components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  moduleName: string
): React.FC<P> {
  return function ComponentWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary moduleName={moduleName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Minimal error boundary for critical components
 * Shows minimal UI to prevent complete app failure
 */
export function MinimalErrorBoundary({ 
  children, 
  moduleName 
}: { 
  children: ReactNode; 
  moduleName: string;
}): JSX.Element {
  return (
    <ErrorBoundary
      moduleName={moduleName}
      fallback={
        <div style={{ padding: '10px', color: '#666' }}>
          <small>Error in {moduleName}</small>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Custom hook to manually report errors
 * Use in try-catch blocks within components
 */
export function useErrorHandler(): (error: Error, context: string) => void {
  const setError = useAppState((s) => s.actions.data.setError);

  return React.useCallback((error: Error, context = '') => {
    const errorObject: Error = {
      name: error.name || 'Error',
      message: error.message || error.toString(),
      stack: error.stack
    };
    
    setError(errorObject);
  }, [setError]);
}
