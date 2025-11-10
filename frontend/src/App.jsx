// import { useState, useMemo } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// import ErrorBoundary from "./components/ErrorBoundary";
// import { AuthProvider } from "./contexts/AuthContext";
// import AuthGuard from "./components/auth/AuthGuard";
// import LoginPage from "./pages/LoginPage";
// import Header from "./components/Header";
// import RoutePage from "./pages/RoutePage";
// import StationsPage from "./pages/StationsPage";
// import DemoRoutePage from "./pages/DemoRoutePage";
// import ImprovedDispatcherPage from "./pages/ImprovedDispatcherPage";
// import { DEFAULT_LLM_MODEL } from "./constants/config";

// function App() {
//   const [selectedLLM, setSelectedLLM] = useState(DEFAULT_LLM_MODEL);

//   // Memoize QueryClient to prevent recreating on each render (React 19 best practice)
//   const queryClient = useMemo(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             staleTime: 5 * 60 * 1000, // 5 minutes
//             refetchOnWindowFocus: false,
//             retry: 1,
//           },
//         },
//       }),
//     []
//   );

//   return (
//     <ErrorBoundary>
//       <QueryClientProvider client={queryClient}>
//         <AuthProvider>
//           <Router>
//             <div className="min-h-screen bg-gray-50">
//               <Header selectedLLM={selectedLLM} onLLMChange={setSelectedLLM} />

//               <Routes>
//                 {/* Public routes */}
//                 <Route path="/login" element={<LoginPage />} />

//                 {/* Protected routes - require authentication */}
//                 <Route
//                   path="/"
//                   element={
//                     <AuthGuard>
//                       <RoutePage selectedLLM={selectedLLM} />
//                     </AuthGuard>
//                   }
//                 />
//                 <Route
//                   path="/stations"
//                   element={
//                     <AuthGuard>
//                       <StationsPage />
//                     </AuthGuard>
//                   }
//                 />
//                 <Route
//                   path="/dispatcher"
//                   element={
//                     <AuthGuard>
//                       <ImprovedDispatcherPage />
//                     </AuthGuard>
//                   }
//                 />
//                 <Route
//                   path="/demo"
//                   element={
//                     <AuthGuard>
//                       <DemoRoutePage />
//                     </AuthGuard>
//                   }
//                 />
//               </Routes>
//             </div>
//           </Router>
//         </AuthProvider>
//       </QueryClientProvider>
//     </ErrorBoundary>
//   );
// }

// export default App;

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
import ImprovedDispatcherPage from "./pages/ImprovedDispatcherPage";
import DriversPage from "./pages/DriversPage";
import { DEFAULT_LLM_MODEL } from "./constants/config";

// Function to get initial theme from localStorage or system preference
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme') === 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};


function App() {
  const [selectedLLM, setSelectedLLM] = useState(DEFAULT_LLM_MODEL);
  // 1. Initialize darkMode state from local storage/system preference
  const [darkMode, setDarkMode] = useState(getInitialTheme());

  // 2. Effect to apply the 'dark' class to HTML and persist choice
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // Persist the user's choice to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');

  }, [darkMode]); // Reruns when darkMode state changes

  const toggleDarkMode = () => {
    // Simply update the state; the useEffect hook handles DOM and localStorage updates
    setDarkMode(prevMode => !prevMode);
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
            {/* The outer div no longer needs a fixed bg color; the global CSS handles it */}
            <div className="min-h-screen"> 
              <Header 
                selectedLLM={selectedLLM} 
                onLLMChange={setSelectedLLM} 
                // 3. Pass theme props down to Header component
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
                      <ImprovedDispatcherPage />
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
                <Route
                  path="/drivers"
                  element={
                    <AuthGuard>
                      <DriversPage />
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
