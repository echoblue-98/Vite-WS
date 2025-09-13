import React from "react";


// State for ErrorBoundary: tracks error and error state
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}


// ErrorBoundary: catches and displays errors in child components
export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Update state when an error is thrown
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Optionally log error info for monitoring
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here or send to a monitoring service
    // console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div style={{ color: '#ff0055', background: '#1a1a1a', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <p style={{ color: '#fff', marginTop: '1rem' }}>Please refresh the page or contact support if the problem persists.</p>
        </div>
      );
    }
    // Render children if no error
    return this.props.children;
  }
}
