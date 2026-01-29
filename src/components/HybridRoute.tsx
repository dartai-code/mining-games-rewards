import { ReactNode } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from '@/pages/LandingPage';

interface HybridRouteProps {
  children: ReactNode;
}

export function HybridRoute({ children }: HybridRouteProps) {
  const { user, loading } = useFirebaseAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If user is logged in and on landing page, redirect to app
  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      navigate('/app');
    }
  }, [user, loading, location.pathname, navigate]);

  // Show landing page to guests on root path
  if (!loading && !user && location.pathname === '/') {
    return <LandingPage />;
  }

  // Show app content for logged-in users
  return <>{children}</>;
}
