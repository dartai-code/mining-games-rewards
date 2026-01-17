import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/AuthGuard';
import Index from '@/pages/Index';
import AppHome from '@/pages/AppHome';
import JumpClimb from '@/components/JumpClimb';
import StackTower from '@/components/StackTower';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <AuthGuard>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<AppHome />} />
              <Route path="/jump-climb" element={<JumpClimb />} />
              <Route path="/stack-tower" element={<StackTower />} />
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