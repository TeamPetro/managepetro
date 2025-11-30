import { useState, useMemo, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/auth/AuthGuard";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import RoutePage from "./pages/RoutePage";
import StationsPage from "./pages/StationsPage";
import DemoRoutePage from "./pages/DemoRoutePage";
import DispatcherPage from "./pages/DispatcherPage";

function App() {
  const [selectedLLM, setSelectedLLM] = useState("gemini-2.5-flash");
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference, default to false
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark mode class to html element and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Memoize QueryClient to prevent recreating on each render (React 19 best practice)
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    []
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Header 
                selectedLLM={selectedLLM} 
                onLLMChange={setSelectedLLM}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />

              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes - require authentication */}
                <Route
                  path="/"
                  element={
                    <AuthGuard>
                      <RoutePage selectedLLM={selectedLLM} />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/stations"
                  element={
                    <AuthGuard>
                      <StationsPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dispatcher"
                  element={
                    <AuthGuard>
                      <DispatcherPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/demo"
                  element={
                    <AuthGuard>
                      <DemoRoutePage />
                    </AuthGuard>
                  }
                />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
