import React from "react";
import { requireEnv } from "../config/env";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
              An unexpected error occurred. Please refresh the page or contact
              support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() =>
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  })
                }
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm sm:text-base hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
            {requireEnv("VITE_DEV", "true") === "true" && this.state.error && (
              <details className="mt-4 text-xs sm:text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
