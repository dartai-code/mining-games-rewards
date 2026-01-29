/**
 * WEBSITE INTEGRATION GUIDE
 * =========================
 * 
 * This file is NOT active yet. It's ready for when you want to enable the website.
 * 
 * HOW TO ACTIVATE THE WEBSITE:
 * 
 * Step 1: Update App.tsx
 * Replace the existing App.tsx content with this file's content
 * 
 * Step 2: Update Social Links
 * Edit src/config/website.ts and add your Play Store link and social media URLs
 * 
 * Step 3: Test
 * - Logged-in users will see the app (Index page)
 * - Guests will see the website (LandingPage)
 * 
 * Step 4: Deploy
 * Run: npm run build
 * Deploy to Firebase Hosting or Vercel
 * 
 * WHAT HAPPENS:
 * - Route "/" shows LandingPage for guests
 * - Route "/app" shows the game for logged-in users
 * - Automatic redirect: logged-in users on "/" go to "/app"
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/AuthGuard';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import LandingPage from '@/pages/LandingPage';
import Index from '@/pages/Index';
import AppHome from '@/pages/AppHome';
import JumpClimb from '@/components/JumpClimb';
import StackTower from '@/components/StackTower';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Public Landing Route
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }
  
  // If user is logged in and visiting landing page, redirect to app
  if (user) {
    return <Navigate to="/app" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <AuthGuard>
          <BrowserRouter>
            <Routes>
              {/* Public website route - shows landing page to guests */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } 
              />
              
              {/* Protected app routes - requires login */}
              <Route 
                path="/app" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute>
                    <AppHome />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jump-climb" 
                element={
                  <ProtectedRoute>
                    <JumpClimb />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/stack-tower" 
                element={
                  <ProtectedRoute>
                    <StackTower />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthGuard>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
